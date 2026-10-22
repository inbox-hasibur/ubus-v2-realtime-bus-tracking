import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTrafficStatus } from '@/lib/routing';

/**
 * UBus Traffic & YOLO Camera Data Ingestion Endpoint
 * Accepts live telemetry from ESP32 GPS module and ESP32-CAM YOLO inference.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bus_no, latitude, longitude, speed, vehicle_count } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid latitude and longitude numbers are required' },
        { status: 400 }
      );
    }

    const currentSpeed = typeof speed === 'number' ? speed : 30;
    const count = typeof vehicle_count === 'number' ? vehicle_count : undefined;
    const traffic = getTrafficStatus(currentSpeed, count);

    // Update bus in Supabase if bus_no is provided
    if (bus_no) {
      const { data: bus } = await supabase
        .from('buses')
        .select('id')
        .eq('bus_no', String(bus_no))
        .single();

      if (bus?.id) {
        await supabase
          .from('bus_locations')
          .upsert({
            bus_id: bus.id,
            latitude,
            longitude,
            speed: currentSpeed,
            updated_at: new Date().toISOString(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      traffic_level: traffic.level,
      traffic_label: traffic.label,
      traffic_color: traffic.color,
      speed: currentSpeed,
      vehicle_count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('API /api/traffic error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    description: 'UBus Real-Time Traffic & YOLO Camera API',
    sample_payload: {
      bus_no: '12',
      latitude: 23.8820,
      longitude: 90.4005,
      speed: 8.5,
      vehicle_count: 22,
    },
  });
}
