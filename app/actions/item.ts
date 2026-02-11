'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { createInternalNotification } from './notification';
import { sendTelegramMessage } from '@/lib/telegram';

export async function searchItems(query: string, type?: string) {
    try {
        const items = await prisma.item.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } },
                    // Search in related Report location
                    {
                        reports: {
                            some: {
                                location: { contains: query, mode: 'insensitive' }
                            }
                        }
                    }
                ],
                // Filter by status in Report
                ...(type && {
                    reports: {
                        some: {
                            status: type.toLowerCase()
                        }
                    }
                }),
            },
            include: {
                reports: {
                    select: {
                        status: true,
                        date: true,
                        location: true,
                    },
                    take: 1, // Get the associated report
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format items for frontend
        return items.map(item => {
            const report = item.reports[0];
            return {
                id: item.id,
                name: item.name,
                type: report?.status === 'found' ? 'Found' : 'Lost', // Infer type from status
                status: report?.status || 'Unknown',
                date: report?.date || item.createdAt.toISOString().split('T')[0],
                imagePath: item.imagePath,
                description: item.description,
                location: report?.location || 'Unknown location'
            };
        });
    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
}

export async function getItemDetails(id: number) {
    try {
        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                reports: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        claims: true
                    }
                }
            }
        });
        return item;
    } catch (error) {
        console.error("Get item error:", error);
        return null;
    }
}



export async function notifyOwner(itemId: number, message: string) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { success: false, error: "You must be logged in to notify the owner." };
    }

    try {
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            include: {
                reports: {
                    include: { user: true }
                }
            }
        });

        if (!item || !item.reports[0]) {
            return { success: false, error: "Item report not found." };
        }

        const report = item.reports[0];

        // Prevent self-notification
        if (report.userId === Number(session.user.id)) {
            return { success: false, error: "You cannot notify yourself." };
        }

        // 1. In-App Notification
        await createInternalNotification(
            report.userId,
            `Start Chat: Someone found your "${item.name}"! Message: "${message}"`,
            'match', // Using 'match' type for now as it fits the discovery context
            `/item/${itemId}`
        );

        // 2. Telegram Notification
        if (report.user.telegramChatId) {
            await sendTelegramMessage(
                report.user.telegramChatId,
                `🔔 *Good News! someone found your lost item!*\n\nItem: *${item.name}*\nFinder: ${session.user.name}\nMessage: _"${message}"_\n\nLog in to the app to coordinate!`
            );
        }

        return { success: true, message: "Owner notified! They will contact you if needed." };

    } catch (error) {
        console.error("Notify owner error:", error);
        return { success: false, error: "Failed to notify owner." };
    }
}
