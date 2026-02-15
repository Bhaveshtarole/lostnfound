
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL
        }
    }
});

async function main() {
    const email = 'bhaveshtarole989@gmail.com';

    console.log(`Looking for user with email: ${email}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { isAdmin: true },
        });

        console.log(`Successfully updated user ${user.name} (${user.email}) to Admin.`);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
