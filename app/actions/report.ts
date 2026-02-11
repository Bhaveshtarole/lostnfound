'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { findMatchesForReport } from '@/lib/matching';
import { sendTelegramMessage } from '@/lib/telegram';
import { createInternalNotification } from './notification';

export async function getUserReports(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                reports: {
                    include: {
                        item: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!user) return [];

        return user.reports.map(report => ({
            id: report.item.id, // Link to item details
            name: report.item.name,
            type: report.status === 'found' ? 'Found' : 'Lost',
            status: report.status,
            date: report.date || report.createdAt.toISOString().split('T')[0],
            imagePath: report.item.imagePath
        }));
    } catch (error) {
        console.error("Get user reports error:", error);
        return [];
    }
}

export async function getUserIncomingClaims(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                reports: {
                    where: {
                        status: 'found', // Only found items can be claimed
                        claims: {
                            some: {} // Only reports that have claims
                        }
                    },
                    include: {
                        item: true,
                        claims: {
                            include: {
                                claimer: {
                                    select: {
                                        name: true,
                                        email: true,
                                        phone: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) return [];

        // Flatten the structure: We want a list of claims, with item details attached
        const incomingClaims = [];
        for (const report of user.reports) {
            for (const claim of report.claims) {
                incomingClaims.push({
                    id: claim.id,
                    itemName: report.item.name,
                    itemImage: report.item.imagePath,
                    claimerName: claim.claimer.name,
                    claimerEmail: claim.claimer.email,
                    proof: claim.proofDescription,
                    status: claim.status, // pending, approved, rejected
                    date: claim.createdAt.toISOString().split('T')[0],
                    reportId: report.id
                });
            }
        }

        // Sort by pending first, then date
        return incomingClaims.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

    } catch (error) {
        console.error("Get incoming claims error:", error);
        return [];
    }
}

export async function submitReport(formData: FormData) {
    try {
        const name = formData.get('itemName') as string;
        const category = formData.get('category') as string;
        const description = formData.get('description') as string;
        const location = formData.get('location') as string;
        const date = formData.get('date') as string;
        const status = formData.get('status') as string; // 'lost' or 'found'
        const imagePath = formData.get('imagePath') as string;

        // User Info
        const userName = formData.get('userName') as string;
        const userEmail = formData.get('userEmail') as string;
        const userPhone = formData.get('userPhone') as string;

        if (!name || !category || !location || !date || !status || !userName || !userEmail) {
            return { success: false, error: 'Missing required fields' };
        }

        // 1. Find or Create User
        let user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: userName,
                    email: userEmail,
                    phone: userPhone,
                }
            });
        }

        // 2. Create Item
        const item = await prisma.item.create({
            data: {
                name,
                category,
                description,
                imagePath: imagePath || null,
                // Status is on the Report, not the Item model in this schema version
            }
        });

        // 3. Create Report
        const report = await prisma.report.create({
            data: {
                userId: user.id,
                itemId: item.id,
                status: status,
                location,
                date,
                // Image path is stored on the Item, not the Report
            }
        });

        revalidatePath('/');
        revalidatePath('/search');
        revalidatePath('/matching');

        // Trigger Async Matching & Notifications
        // We don't await this to keep the UI response fast
        (async () => {
            try {
                const matches = await findMatchesForReport(report.id);

                // Notify users if matches found
                for (const match of matches) {
                    if (match.confidence > 70 && match.report.user.telegramChatId) {
                        const matchType = status === 'lost' ? 'Found' : 'Lost'; // If I lost, I found a 'Found' item

                        await sendTelegramMessage(
                            match.report.user.telegramChatId,
                            `🎯 *Potential Match Found!*\n\nWe found a *${matchType}* item that matches your *${status === 'lost' ? 'Found' : 'Lost'}* item report.\n\nItem: *${name}*\nConfidence: ${match.confidence}%\n\nCheck the Matching page for details!`
                        );
                    }

                    // In-App Notification (Always, even if no Telegram)
                    if (match.confidence > 70) {
                        const matchType = status === 'lost' ? 'Found' : 'Lost';
                        await createInternalNotification(
                            match.report.userId,
                            `Match Found: We found a ${matchType} item similar to yours! (${match.confidence}% confidence)`,
                            'match',
                            '/matching'
                        );
                    }
                }
            } catch (e) {
                console.error("Background matching error:", e);
            }
        })();

        return { success: true };
    } catch (error) {
        console.error('Submission error:', error);
        return { success: false, error: 'Failed to submit report' };
    }
}
