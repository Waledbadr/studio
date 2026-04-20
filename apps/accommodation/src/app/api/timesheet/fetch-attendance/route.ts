import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Increase serverless timeout for biometric connection

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Missing start_date or end_date (ex: YYYY-MM-DD)" }, { status: 400 });
    }

    const apiUrl = new URL("http://213.210.196.115:8585/att/api/transactionReport/export/");
    apiUrl.searchParams.append("export_headers", "emp_code,first_name,dept_name,att_date,punch_time,terminal_alias");
    apiUrl.searchParams.append("start_date", `${startDate} 00:00:00`);
    apiUrl.searchParams.append("end_date", `${endDate} 23:59:59`);
    apiUrl.searchParams.append("departments", "10");
    apiUrl.searchParams.append("employees", "-1");
    apiUrl.searchParams.append("page_size", "999999");
    apiUrl.searchParams.append("export_type", "txt");
    apiUrl.searchParams.append("page", "1");
    apiUrl.searchParams.append("limit", "999999");

    // The API uses Basic Auth
    const authHeader = `Basic ${Buffer.from("Housing:A1111111").toString("base64")}`;

    // 60-second timeout to handle large date ranges from the biometric server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response: Response;
    try {
      response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: { Authorization: authHeader },
        cache: 'no-store',
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      const isTimeout = fetchError.name === 'AbortError';
      const isNetworkError = fetchError.cause?.code === 'ECONNREFUSED' || fetchError.cause?.code === 'ECONNRESET';
      const msg = isTimeout
        ? 'انتهت مهلة الاتصال بخادم البصمة (60 ثانية). تحقق من الشبكة.'
        : isNetworkError
        ? `فشل الاتصال بخادم البصمة (${fetchError.cause?.code}). تأكد أن الخادم 213.210.196.115:8585 يعمل ومتاح.`
        : `خطأ في الشبكة: ${fetchError.message}`;
      return NextResponse.json({ error: msg, code: fetchError.cause?.code || fetchError.name }, { status: 503 });
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `خادم البصمة أعاد خطأ ${response.status}`, details },
        { status: response.status }
      );
    }

    const textData = await response.text();
    
    // Parse the text data (CSV format) into JSON
    const lines = textData.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const parsedData = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(",");
      if (columns.length >= 6) {
        parsedData.push({
          employeeId: columns[0]?.trim(),
          firstName: columns[1]?.trim(),
          department: columns[2]?.trim(),
          date: columns[3]?.trim(),
          time: columns[4]?.trim(),
          deviceName: columns[5]?.trim(),
        });
      }
    }

    return NextResponse.json({ data: parsedData });
  } catch (error: any) {
    console.error('[fetch-attendance] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
