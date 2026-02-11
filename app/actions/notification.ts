'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserNotifications() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) return [];

        return await prisma.appNotification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to last 20 notifications
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return [];
    }
}

export async function markNotificationRead(id: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false };

    try {
        await prisma.appNotification.update({
            where: { id },
            data: { read: true }
        });
        revalidatePath('/'); // Refresh UI
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// Internal helper - not exported as a server action for client use
export async function createInternalNotification(userId: number, message: string, type: 'claim' | 'match' | 'system', link?: string) {
    try {
        await prisma.appNotification.create({
            data: {
                userId,
                message,
                type,
                link
            }
        });
        return true;
    } catch (error) {
        console.error("Create notification error:", error);
        return false;
    }
}
