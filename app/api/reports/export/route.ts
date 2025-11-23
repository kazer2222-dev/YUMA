import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

function toCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function tasksToCsv(tasks: any[]): string {
  const header = [
    'Task ID',
    'Summary',
    'Description',
    'Priority',
    'Status',
    'Assignee',
    'Tags',
    'Due Date',
    'Estimate',
    'Created At',
    'Updated At',
    'Space Slug'
  ];
  const lines = [header.join(',')];
  for (const t of tasks) {
    const row = [
      toCsvValue(t.id),
      toCsvValue(t.summary || ''),
      toCsvValue(t.description || ''),
      toCsvValue(t.priority || ''),
      toCsvValue(t.status?.name || ''),
      toCsvValue(t.assignee ? (t.assignee.name || t.assignee.email) : ''),
      toCsvValue(Array.isArray(t.tags) ? t.tags.join(' | ') : ''),
      toCsvValue(t.dueDate ? new Date(t.dueDate).toISOString() : ''),
      toCsvValue(t.estimate || ''),
      toCsvValue(t.createdAt ? new Date(t.createdAt).toISOString() : ''),
      toCsvValue(t.updatedAt ? new Date(t.updatedAt).toISOString() : ''),
      toCsvValue(t.space?.slug || '')
    ];
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function tasksToHtmlTable(tasks: any[]): string {
  const headers = ['Task ID','Summary','Description','Priority','Status','Assignee','Tags','Due Date','Estimate','Created At','Updated At','Space Slug'];
  const rows = tasks.map((t) => [
    t.id,
    t.summary || '',
    t.description || '',
    t.priority || '',
    t.status?.name || '',
    t.assignee ? (t.assignee.name || t.assignee.email) : '',
    Array.isArray(t.tags) ? t.tags.join(' | ') : '',
    t.dueDate ? new Date(t.dueDate).toISOString() : '',
    t.estimate || '',
    t.createdAt ? new Date(t.createdAt).toISOString() : '',
    t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
    t.space?.slug || ''
  ]);
  const thead = `<tr>${headers.map(h => `<th style="border:1px solid #ccc;padding:4px;text-align:left;">${h}</th>`).join('')}</tr>`;
  const tbody = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ccc;padding:4px;">${String(c).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>`).join('')}</tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table>${thead}${tbody}</table></body></html>`;
}

function encodePdfString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r|\n/g, ' ');
}

function makeSimplePdf(tasks: any[], slug: string): Uint8Array {
  // Column layout table (absolute positioned text)
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 36;
  const rowHeight = 14;
  const headerGap = 6;
  const startY = pageHeight - margin - 30;
  const cols = [
    { x: margin + 0,  key: 'id',        label: 'ID',           width: 70 },
    { x: margin + 75, key: 'summary',   label: 'Summary',      width: 180 },
    { x: margin + 260,key: 'priority',  label: 'Priority',     width: 50 },
    { x: margin + 315,key: 'status',    label: 'Status',       width: 70 },
    { x: margin + 390,key: 'assignee',  label: 'Assignee',     width: 120 },
  ];

  const getCell = (t: any, key: string): string => {
    if (key === 'status') return t.status?.name || '';
    if (key === 'assignee') return t.assignee ? (t.assignee.name || t.assignee.email) : '';
    return (t[key] ?? '') as string;
  };

  const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1) + '…' : s);

  const pagesContent: string[] = [];
  let y = startY;
  let pageContent = `BT /F1 10 Tf 1 0 0 1 ${margin} ${pageHeight - margin} Tm (Report: ${encodePdfString(slug)}) Tj 1 0 0 1 ${margin} ${pageHeight - margin - rowHeight} Tm (Generated: ${encodePdfString(new Date().toISOString())}) Tj`;

  const drawHeader = () => {
    let headerStr = '';
    for (const c of cols) {
      headerStr += ` 1 0 0 1 ${c.x} ${y} Tm (${encodePdfString(c.label)}) Tj`;
    }
    return headerStr;
  };

  // header
  pageContent += drawHeader();
  y -= rowHeight + headerGap;

  for (const t of tasks) {
    if (y < margin + 30) {
      pageContent += ' ET';
      pagesContent.push(pageContent);
      y = startY;
      pageContent = `BT /F1 10 Tf` + drawHeader();
      y -= rowHeight + headerGap;
    }
    for (const c of cols) {
      const raw = truncate(String(getCell(t, c.key) || ''), Math.floor(c.width / 5.2));
      pageContent += ` 1 0 0 1 ${c.x} ${y} Tm (${encodePdfString(raw)}) Tj`;
    }
    y -= rowHeight;
  }
  pageContent += ' ET';
  pagesContent.push(pageContent);

  // Build PDF objects
  const objects: string[] = [];
  const pageIds: number[] = [];
  let objIndex = 1;
  const addObj = (s: string) => { objects.push(`${objIndex++} 0 obj\n${s}\nendobj\n`); return objIndex - 1; };

  const catalogId = addObj('<< /Type /Catalog /Pages 0 0 R >>'); // placeholder
  const pagesId = addObj('<< /Type /Pages /Kids [] /Count 0 >>');
  const fontId = addObj('<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>');

  for (const content of pagesContent) {
    const contentId = addObj(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = addObj(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }

  // Rewrite pages and catalog with correct refs
  objects[catalogId - 1] = `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`;
  const kids = pageIds.map((id) => `${id} 0 R`).join(' ');
  objects[pagesId - 1] = `${pagesId} 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>\nendobj\n`;

  // xref
  let offset = 9; // %PDF-1.4\n
  const offsets: number[] = [0];
  let body = '';
  for (const obj of objects) { offsets.push(offset); body += obj; offset += obj.length; }
  const xrefStart = offset;
  let xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) xref += (offsets[i].toString().padStart(10, '0')) + ' 00000 n \n';
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const pdfStr = `%PDF-1.4\n` + body + xref + trailer;
  return new TextEncoder().encode(pdfStr);
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('space');
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    if (!slug) {
      return NextResponse.json({ success: false, message: 'Missing space parameter' }, { status: 400 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({ where: { space: { slug }, userId: user.id } });
    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { space: { slug } },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        status: true,
        space: { select: { id: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const normalized = tasks.map((t) => ({ ...t, tags: (() => { try { return t.tags ? JSON.parse(t.tags) : []; } catch { return []; } })() }));

    if (format === 'csv') {
      const csv = tasksToCsv(normalized);
      const fileName = `tasks-${slug}-${new Date().toISOString().slice(0,10)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}"` }
      });
    }

    if (format === 'xlsx' || format === 'xls' || format === 'excel') {
      // HTML table that Excel can open
      const html = tasksToHtmlTable(normalized);
      const fileName = `tasks-${slug}-${new Date().toISOString().slice(0,10)}.xls`;
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}"` }
      });
    }

    if (format === 'pdf') {
      const pdf = makeSimplePdf(normalized, slug);
      const fileName = `tasks-${slug}-${new Date().toISOString().slice(0,10)}.pdf`;
      return new NextResponse(pdf as any, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` } });
    }

    // Unsupported formats -> JSON
    return NextResponse.json({ success: true, tasks: normalized });
  } catch (error) {
    console.error('Reports export error:', error);
    return NextResponse.json({ success: false, message: 'Failed to export report' }, { status: 500 });
  }
}


