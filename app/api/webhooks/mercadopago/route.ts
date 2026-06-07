export async function POST(req: NextRequest) {
  console.log("WEBHOOK EXECUTOU");

  return Response.json({
    ok: true,
    timestamp: Date.now(),
  });
}