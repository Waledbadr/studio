import { NextRequest, NextResponse } from "next/server";

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

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: `API responded with status ${response.status}`, details: await response.text() }, { status: response.status });
    }

    const textData = await response.text();
    
    // Parse the text data (CSV format) into JSON
    const lines = textData.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const parsedData = [];
    const headers = lines[0].split(",");

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
