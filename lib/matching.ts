
import { prisma } from "@/lib/prisma";

export async function findMatchesForReport(reportId: number) {
    const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { item: true, user: true }
    });

    if (!report) return [];

    const targetStatus = report.status === 'lost' ? 'found' : 'lost';

    // Find potential candidates
    const candidates = await prisma.report.findMany({
        where: {
            status: targetStatus,
            // Optimization: Only fetch items created AFTER the lost date if checking a found item? 
            // For now, fetch all active candidates
        },
        include: { item: true, user: true }
    });

    const matches = [];

    for (const candidate of candidates) {
        let score = 0;

        // 1. Category Mismatch (Hard Filter)
        if (report.item.category.toLowerCase() !== candidate.item.category.toLowerCase()) {
            continue;
        }

        // 2. Date Logic
        const reportDate = report.date ? new Date(report.date) : null;
        const candidateDate = candidate.date ? new Date(candidate.date) : null;

        // If I found an item, it must have been lost BEFORE I found it.
        // If I lost an item, it must have been found AFTER I lost it.
        if (report.status === 'found' && reportDate && candidateDate && candidateDate > reportDate) {
            continue; // Found date cannot be before lost date
        }
        if (report.status === 'lost' && reportDate && candidateDate && candidateDate < reportDate) {
            continue;
        }

        // 3. Name & Brand Similarity (Token Matching)
        const myTokens = (report.item.name + " " + (report.item.brand || "")).toLowerCase().split(/\s+/);
        const theirTokens = (candidate.item.name + " " + (candidate.item.brand || "")).toLowerCase().split(/\s+/);

        const commonTokens = myTokens.filter(token => theirTokens.includes(token));
        if (commonTokens.length > 0) {
            score += commonTokens.length * 15;
        }

        // 4. Color Match
        if (report.item.color && candidate.item.color &&
            report.item.color.toLowerCase() === candidate.item.color.toLowerCase()) {
            score += 20;
        }

        // 5. Location Proximity (String Matching for now)
        if (report.location && candidate.location) {
            const myLoc = report.location.toLowerCase();
            const theirLoc = candidate.location.toLowerCase();
            if (myLoc.includes(theirLoc) || theirLoc.includes(myLoc)) {
                score += 25;
            }
        }

        // 6. Description Analysis
        if (report.item.description && candidate.item.description) {
            const myDesc = report.item.description.toLowerCase().split(/\s+/);
            const theirDesc = candidate.item.description.toLowerCase().split(/\s+/);
            const commonDesc = myDesc.filter(t => theirDesc.includes(t) && t.length > 3);
            if (commonDesc.length > 0) {
                score += commonDesc.length * 5;
            }
        }

        const finalConfidence = Math.min(Math.round(score), 99);

        if (finalConfidence > 60) {
            matches.push({
                report: candidate,
                confidence: finalConfidence
            });
        }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
}
