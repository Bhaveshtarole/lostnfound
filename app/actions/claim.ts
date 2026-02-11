'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendTelegramMessage } from "@/lib/telegram";
import { createInternalNotification } from "@/app/actions/notification";

export async function createClaim(reportId: number, proofDescription: string) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { success: false, error: "You must be logged in to claim an item." };
    }

    try {
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { user: true, item: true }
        });

        if (!report) {
            return { success: false, error: "Report not found." };
        }

        // Prevent finder from claiming their own find
        if (report.userId === Number(session.user.id)) {
            return { success: false, error: "You cannot claim an item you reported as found." };
        }

        // Create the claim
        await prisma.claim.create({
            data: {
                foundReportId: reportId,
                claimerId: Number(session.user.id),
                proofDescription: proofDescription,
                status: 'pending'
            }
        });

        // Notify the finder (reporter) via Telegram
        if (report.user.telegramChatId) {
            await sendTelegramMessage(
                report.user.telegramChatId,
                `🔔 *New Claim on your Found Item!*\n\nItem: *${report.item.name}*\nClaimed by: ${session.user.name}\nProof: _${proofDescription}_\n\nCheck your profile to approve or reject.`
            );
        }

        // Notify via In-App
        await createInternalNotification(
            report.userId,
            `New Claim: ${session.user.name} claimed "${report.item.name}"`,
            'claim',
            '/profile'
        );

        revalidatePath(`/item/${report.itemId}`);
        return { success: true, message: "Claim submitted successfully! The finder will review your proof." };

    } catch (error) {
        console.error("Create claim error:", error);
        return { success: false, error: "Failed to submit claim." };
    }
}

export async function updateClaimStatus(claimId: number, status: 'approved' | 'rejected') {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                foundReport: {
                    include: { item: true }
                }
            }
        });

        if (!claim) {
            return { success: false, error: "Claim not found" };
        }

        // Verify the current user is the original reporter (the finder)
        if (claim.foundReport.userId !== Number(session.user.id)) {
            return { success: false, error: "You are not authorized to manage this claim." };
        }

        if (status === 'approved') {
            // Transaction to update everything safely
            await prisma.$transaction([
                // 1. Update Claim Status
                prisma.claim.update({
                    where: { id: claimId },
                    data: { status: 'approved', processedAt: new Date() }
                }),
                // 3. Update Report Status
                prisma.report.update({
                    where: { id: claim.foundReportId },
                    data: { status: 'claimed' }
                }),
                // 4. Award Points to Finder (Reporter)
                prisma.user.update({
                    where: { id: claim.foundReport.userId },
                    data: { finderPoints: { increment: 50 } }
                }),
                // 5. Reject other pending claims for this item
                prisma.claim.updateMany({
                    where: {
                        foundReportId: claim.foundReportId,
                        id: { not: claimId },
                        status: 'pending'
                    },
                    data: { status: 'rejected', processedAt: new Date() }
                })
            ]);

            // Notify Claimer (Approved)
            await createInternalNotification(
                claim.claimerId,
                `Claim Approved! Only you can now pick up "${claim.foundReport.item?.name || 'the item'}".`,
                'system',
                `/item/${claim.foundReport.itemId}`
            );

        } else {
            // Just reject the claim
            await prisma.claim.update({
                where: { id: claimId },
                data: { status: 'rejected', processedAt: new Date() }
            });

            // Notify Claimer (Rejected)
            await createInternalNotification(
                claim.claimerId,
                `Claim Rejected for "${claim.foundReport.item?.name || 'item'}". The reporter did not accept your proof.`,
                'system',
                `/item/${claim.foundReport.itemId}`
            );
        }

        revalidatePath('/profile');
        revalidatePath(`/item/${claim.foundReport.itemId}`);
        return { success: true };

    } catch (error) {
        console.error("Update claim error:", error);
        return { success: false, error: "Failed to update claim status." };
    }
}
