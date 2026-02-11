'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { sendTelegramMessage } from "@/lib/telegram";

export async function updateTelegramChatId(chatId: string) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.user.update({
            where: { email: session.user.email as string },
            data: { telegramChatId: chatId }
        });

        revalidatePath('/profile');
        return { success: true, message: "Telegram Chat ID updated successfully!" };
    } catch (error) {
        console.error("Update Telegram ID error:", error);
        return { success: false, error: "Failed to update Telegram Chat ID." };
    }
}

export async function testTelegramNotification() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { telegramChatId: true, name: true }
        });

        if (!user?.telegramChatId) {
            return { success: false, error: "No Telegram Chat ID found. Please save it first." };
        }

        const sent = await sendTelegramMessage(
            user.telegramChatId,
            `👋 *Hello ${user.name}!* \n\nThis is a test notification from Lost & Found App. \n\n✅ Integration is working!`
        );

        if (sent) {
            return { success: true, message: "Test message sent! Check your Telegram." };
        } else {
            return { success: false, error: "Failed to send. Is the bot blocked or ID duplicate?" };
        }
    } catch (error) {
        return { success: false, error: "Test failed." };
    }
}
