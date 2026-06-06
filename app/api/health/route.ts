import { NextResponse } from "next/server";
import { isBootComplete, getBootDuration, getBootTimings } from "@/src/lib/startup";

export const dynamic = "force-dynamic";

export async function GET() {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100;
  const heapTotalMB = Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100;
  const rssMB = Math.round((memUsage.rss / 1024 / 1024) * 100) / 100;

  const status = isBootComplete() ? "ok" : "starting";

  return NextResponse.json({
    status,
    uptime: Math.floor(process.uptime()),
    bootDurationMs: getBootDuration(),
    bootComplete: isBootComplete(),
    memory: {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      rss: `${rssMB}MB`,
      heapUsagePercent: heapTotalMB > 0
        ? Math.round((heapUsedMB / heapTotalMB) * 10000) / 100
        : 0,
    },
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV,
  });
}
