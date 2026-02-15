import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');

        // Upload to Supabase Storage
        const { data: uploadData, error } = await supabase
            .storage
            .from('item-images')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            return NextResponse.json({ success: false, error: 'Upload failed: ' + error.message }, { status: 500 });
        }

        // Get Public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('item-images')
            .getPublicUrl(filename);

        return NextResponse.json({ success: true, path: publicUrlData.publicUrl });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Upload error:', errorMessage);
        return NextResponse.json({ success: false, error: 'Upload failed: ' + errorMessage }, { status: 500 });
    }
}
