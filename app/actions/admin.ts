'use server';

import { prisma } from '@/lib/prisma';

export async function getAdminStats() {
    try {
        const totalReports = await prisma.report.count();
        const resolvedReports = await prisma.report.count({
            where: {
                status: { in: ['claimed', 'returned'] }
            }
        });
        const usersCount = await prisma.user.count();
        const pendingClaims = await prisma.claim.count({
            where: { status: 'pending' }
        });

        const recentReports = await prisma.report.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                item: true,
                user: true
            }
        });

        return {
            totalReports,
            resolvedReports,
            usersCount,
            pendingClaims,
            recentReports: recentReports.map(r => ({
                id: r.item.id,
                name: r.item.name,
                type: r.status === 'found' ? 'Found' : 'Lost',
                userEmail: r.user.email,
                status: r.status,
                date: r.date || r.createdAt.toISOString().split('T')[0]
            }))
        };
    } catch (error) {
        console.error("Admin stats error:", error);
        return null;
    }
}

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function deleteReport(itemId: number) {
    const session = await getServerSession(authOptions);

    // Security Check: Must be Admin
    if (!session || !session.user || !session.user.isAdmin) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Find the report to get its ID (needed to find claims)
        const report = await prisma.report.findFirst({
            where: { itemId: itemId }
        });

        if (!report) {
            return { success: false, error: "Report not found" };
        }

        // Transaction to delete everything safely
        await prisma.$transaction([
            // Delete all claims associated with this report
            prisma.claim.deleteMany({
                where: { foundReportId: report.id }
            }),
            // Delete the report itself
            prisma.report.delete({
                where: { id: report.id }
            }),
            // Delete the item
            prisma.item.delete({
                where: { id: itemId }
            })
        ]);

        revalidatePath('/admin');
        revalidatePath('/search');
        return { success: true };
    } catch (error) {
        console.error("Delete report error:", error);
        return { success: false, error: "Failed to delete item" };
    }
}
