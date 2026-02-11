'use server';

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function requestPasswordReset(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security, do not reveal if user does not exist
            return { success: true, message: "If an account exists, a reset link has been sent." };
        }

        const token = randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 3600000); // 1 hour from now

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry,
            },
        });

        // Mock Email Sending
        const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
        console.log("---------------------------------------------------");
        console.log(`Password Reset Link for ${email}:`);
        console.log(resetLink);
        console.log("---------------------------------------------------");

        return { success: true, message: "If an account exists, a reset link has been sent." };
    } catch (error) {
        console.error("Request password reset error:", error);
        return { success: false, error: "Something went wrong. Please try again." };
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { resetToken: token },
        });

        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            return { success: false, error: "Invalid or expired token." };
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return { success: true, message: "Password updated successfully. Please log in." };
    } catch (error) {
        console.error("Reset password error:", error);
        return { success: false, error: "Failed to reset password." };
    }
}
