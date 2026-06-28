from datetime import datetime
from app.models.payroll import Payslip
from app.models.employee import Employee
from app.models.organisation import Organisation
from app.core.storage.s3 import storage


class PayslipPDFService:
    @staticmethod
    async def generate_and_upload(payslip: Payslip, employee: Employee, organisation: Organisation | None = None) -> str:
        """Generate payslip HTML and upload to S3, return html_url"""
        html_content = PayslipPDFService._generate_html(payslip, employee, organisation)

        # Upload HTML to S3 with structure: payslips/employee_code/year/month/pdf.html
        key = f"payslips/{employee.employee_code}/{payslip.year}/{payslip.month:02d}/pdf.html"
        await storage.upload(html_content.encode('utf-8'), key, "text/html")

        # Generate presigned URL
        html_url = await storage.get_presigned_url(key)
        return html_url

    @staticmethod
    def _number_to_words(num: float) -> str:
        """Convert number to words in Indian numbering system"""
        num = int(num)
        ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
        tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
        scales = ['', 'Thousand', 'Lakh', 'Crore']

        def convert_below_thousand(n: int) -> str:
            if n == 0:
                return ''
            if n < 10:
                return ones[n]
            if n < 20:
                return ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
                        'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'][n - 10]
            if n < 100:
                return tens[n // 10] + (' ' + ones[n % 10] if n % 10 else '')
            return ones[n // 100] + ' Hundred' + (' ' + convert_below_thousand(n % 100) if n % 100 else '')

        if num == 0:
            return 'Zero'

        parts = []
        scale_idx = 0
        while num > 0:
            if num % 1000 != 0:
                part = convert_below_thousand(num % 1000)
                if scale_idx > 0:
                    part += ' ' + scales[scale_idx]
                parts.append(part)
            num //= 1000
            scale_idx += 1

        return ' '.join(reversed(parts))

    @staticmethod
    def _get_month_date_range(year: int, month: int) -> tuple[str, str, str]:
        """Get month name and date range"""
        from datetime import timedelta
        month_date = datetime(year, month, 1)
        month_name = month_date.strftime("%B")
        month_start = month_date.strftime("%d %b")
        next_month = month_date.replace(day=28) + timedelta(days=4)
        month_end = (next_month.replace(day=1) - timedelta(days=1)).strftime("%d %b")
        return month_name, month_start, month_end

    @staticmethod
    def _generate_html(payslip: Payslip, employee: Employee, organisation: Organisation | None = None) -> str:
        """Generate HTML content for payslip (can be printed as PDF from browser)"""
        month_name, month_start, month_end_str = PayslipPDFService._get_month_date_range(payslip.year, payslip.month)
        net_salary_words = PayslipPDFService._number_to_words(payslip.net_salary)

        basic = payslip.gross_salary * 0.45
        hra = payslip.gross_salary * 0.20
        conveyance = payslip.gross_salary * 0.08
        other_allowance = payslip.gross_salary * 0.15
        arrears = 0.0

        total_contributions = payslip.pf_employee + payslip.esi_employee
        professional_tax = payslip.tds * 0.15
        income_tax = payslip.tds * 0.85

        try:
            date_joined = employee.date_of_joining.strftime('%d %b %Y') if employee.date_of_joining else 'N/A'
        except (AttributeError, TypeError):
            date_joined = 'N/A'

        try:
            designation = employee.designation.name if employee.designation else 'N/A'
        except (AttributeError, TypeError):
            designation = 'N/A'

        try:
            department = employee.department.name if employee.department else 'N/A'
        except (AttributeError, TypeError):
            department = 'N/A'

        pan_number = getattr(employee, 'pan_number', None) or 'N/A'
        uan = getattr(employee, 'pf_uan_number', None) or 'N/A'
        pf_number = getattr(employee, 'pf_number', None) or 'N/A'

        company_name = organisation.name if organisation else "FINFORZ TECHNOLOGIES PVT LTD"
        address_line1 = (organisation.address_line1 if organisation else None) or "WORKEZ, 1ST FLOOR, SM TOWERS, SEEVARAM 1ST CROSS ST, SEEVARAM,"
        address_line2 = (organisation.address_line2 if organisation else None) or "PERUNGUDI, CHENNAI, TAMIL NADU 600096"

        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Payslip - {month_name.upper()} {payslip.year} | Finforz Technologies</title>
          <style>
            * {{
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }}

            body {{
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #f0f0f0;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              padding: 30px 20px;
            }}

            .payslip-wrapper {{
              background: #ffffff;
              width: 780px;
              padding: 36px 40px 40px;
              box-shadow: 0 2px 16px rgba(0,0,0,0.12);
            }}

            .header {{
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 24px;
            }}

            .header-left .payslip-title {{
              font-size: 24px;
              font-weight: 800;
              color: #111;
              letter-spacing: 0.5px;
            }}

            .header-left .payslip-title span {{
              font-weight: 400;
            }}

            .header-left .company-name {{
              font-size: 11px;
              font-weight: 700;
              color: #222;
              margin-top: 10px;
              letter-spacing: 0.3px;
            }}

            .header-left .company-address {{
              font-size: 10px;
              color: #555;
              margin-top: 4px;
              line-height: 1.5;
              max-width: 320px;
            }}

            .divider {{
              border: none;
              border-top: 1.5px solid #ddd;
              margin: 14px 0;
            }}

            .divider-thin {{
              border: none;
              border-top: 1px solid #e5e5e5;
              margin: 10px 0;
            }}

            .employee-name {{
              font-size: 15px;
              font-weight: 700;
              color: #111;
              margin-bottom: 12px;
            }}

            .info-grid {{
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px 10px;
              margin-bottom: 10px;
            }}

            .info-item label {{
              font-size: 9.5px;
              color: #888;
              display: block;
              margin-bottom: 3px;
            }}

            .info-item .value {{
              font-size: 11.5px;
              color: #1a1a1a;
              font-weight: 500;
            }}

            .pan-row {{
              margin-top: 8px;
            }}

            .section-title {{
              font-size: 11.5px;
              font-weight: 700;
              color: #222;
              margin-bottom: 8px;
              letter-spacing: 0.3px;
            }}

            .days-grid {{
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 18px;
            }}

            .salary-table-wrap {{
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0;
              border: 1px solid #ddd;
            }}

            .salary-col {{
              padding: 14px 16px;
            }}

            .salary-col:first-child {{
              border-right: 1px solid #ddd;
            }}

            .col-heading {{
              font-size: 11.5px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 10px;
            }}

            .salary-row {{
              display: flex;
              justify-content: space-between;
              margin-bottom: 7px;
              font-size: 11.5px;
              color: #333;
            }}

            .salary-row .label {{
              color: #444;
            }}

            .salary-row .amount {{
              font-variant-numeric: tabular-nums;
              color: #1a1a1a;
            }}

            .salary-row.bold {{
              font-weight: 700;
              color: #111;
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px solid #e5e5e5;
            }}

            .salary-row.bold .label,
            .salary-row.bold .amount {{
              color: #111;
              font-weight: 700;
            }}

            .sub-heading {{
              font-size: 11.5px;
              font-weight: 700;
              color: #1a1a1a;
              margin-top: 14px;
              margin-bottom: 8px;
            }}

            .net-salary-wrap {{
              border: 1px solid #ddd;
              border-top: none;
              padding: 14px 16px;
            }}

            .net-row {{
              display: flex;
              align-items: baseline;
              gap: 40px;
              margin-bottom: 10px;
            }}

            .net-row:last-child {{
              margin-bottom: 0;
            }}

            .net-label {{
              font-size: 11.5px;
              color: #444;
              min-width: 180px;
            }}

            .net-value {{
              font-size: 13px;
              font-weight: 600;
              color: #1a1a1a;
            }}

            .net-words {{
              font-size: 11.5px;
              font-weight: 700;
              color: #111;
              max-width: 420px;
              line-height: 1.5;
            }}

            .note {{
              margin-top: 18px;
              font-size: 10.5px;
              color: #333;
            }}

            .note span {{
              font-weight: 700;
            }}

            .note em {{
              font-style: italic;
              font-weight: 400;
              color: #444;
            }}

            .logo-section {{
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 20px;
            }}

            .logo-section img {{
              height: 60px;
              width: auto;
            }}

            .company-header-text h2 {{
              font-size: 16px;
              font-weight: 700;
              color: #1a1a1a;
              margin: 0;
            }}

            .company-header-text p {{
              font-size: 10px;
              color: #666;
              margin: 3px 0 0 0;
              line-height: 1.3;
            }}

            @media print {{
              body {{ background: white; padding: 0; }}
              .payslip-wrapper {{ box-shadow: none; }}
            }}
          </style>
        </head>
        <body>
        <div class="payslip-wrapper">

          <div class="logo-section">
            {f'<img src="{organisation.logo_url}" alt="Logo">' if organisation and organisation.logo_url else ''}
            <div class="company-header-text">
              <h2>{company_name}</h2>
              <p>{address_line1}<br>{address_line2}</p>
            </div>
          </div>

          <div class="header">
            <div class="header-left">
              <div class="payslip-title">PAYSLIP <span>{month_name.upper()} {payslip.year}</span></div>
            </div>
          </div>

          <hr class="divider">

          <div class="employee-name">{employee.first_name.upper()} {employee.last_name.upper()}</div>

          <div class="info-grid">
            <div class="info-item">
              <label>Employee Number</label>
              <div class="value">{employee.employee_code}</div>
            </div>
            <div class="info-item">
              <label>Date Joined</label>
              <div class="value">{date_joined}</div>
            </div>
            <div class="info-item">
              <label>Department</label>
              <div class="value">{department}</div>
            </div>
            <div class="info-item">
              <label>Designation</label>
              <div class="value">{designation}</div>
            </div>
          </div>

          <hr class="divider-thin">

          <div class="info-grid">
            <div class="info-item">
              <label>Pay Cycle Dates</label>
              <div class="value">{month_start} - {month_end_str}</div>
            </div>
            <div class="info-item">
              <label>Payment Mode</label>
              <div class="value">Cash</div>
            </div>
            <div class="info-item">
              <label>UAN</label>
              <div class="value">{uan}</div>
            </div>
            <div class="info-item">
              <label>PF Number</label>
              <div class="value" style="font-size:10.5px;">{pf_number}</div>
            </div>
          </div>

          <hr class="divider-thin">

          <div class="info-item pan-row">
            <label>PAN Number</label>
            <div class="value">{pan_number}</div>
          </div>

          <hr class="divider" style="margin-top:16px;">

          <div class="section-title">SALARY DETAILS</div>

          <div class="days-grid">
            <div class="info-item">
              <label>Actual Payable Days</label>
              <div class="value">{payslip.paid_days:.1f}</div>
            </div>
            <div class="info-item">
              <label>Total Working Days</label>
              <div class="value">{payslip.working_days:.1f}</div>
            </div>
            <div class="info-item">
              <label>Loss Of Pay Days</label>
              <div class="value">{payslip.lop_days:.2f}</div>
            </div>
            <div class="info-item">
              <label>Days Payable</label>
              <div class="value">{int(payslip.paid_days)}</div>
            </div>
          </div>

          <div class="salary-table-wrap">
            <div class="salary-col">
              <div class="col-heading">EARNINGS</div>
              <div class="salary-row">
                <span class="label">Basic</span>
                <span class="amount">{basic:,.2f}</span>
              </div>
              <div class="salary-row">
                <span class="label">HRA</span>
                <span class="amount">{hra:,.2f}</span>
              </div>
              <div class="salary-row">
                <span class="label">Conveyance Allowance</span>
                <span class="amount">{conveyance:,.2f}</span>
              </div>
              <div class="salary-row">
                <span class="label">Other Allowance</span>
                <span class="amount">{other_allowance:,.2f}</span>
              </div>
              <div class="salary-row">
                <span class="label">Arrears</span>
                <span class="amount">{arrears:,.2f}</span>
              </div>
              <div class="salary-row bold">
                <span class="label">Total Earnings (A)</span>
                <span class="amount">{payslip.gross_salary:,.2f}</span>
              </div>
            </div>

            <div class="salary-col">
              <div class="col-heading">CONTRIBUTIONS</div>
              <div class="salary-row">
                <span class="label">PF Employee</span>
                <span class="amount">{payslip.pf_employee:,.2f}</span>
              </div>
              <div class="salary-row bold">
                <span class="label">Total Contributions (B)</span>
                <span class="amount">{total_contributions:,.2f}</span>
              </div>

              <div class="sub-heading">TAXES &amp; DEDUCTIONS</div>
              <div class="salary-row">
                <span class="label">Professional Tax</span>
                <span class="amount">{professional_tax:,.2f}</span>
              </div>
              <div class="salary-row">
                <span class="label">Total Income Tax</span>
                <span class="amount">{income_tax:,.2f}</span>
              </div>
              <div class="salary-row bold">
                <span class="label">Total Taxes &amp; Deductions (C)</span>
                <span class="amount">{payslip.total_deductions:,.2f}</span>
              </div>
            </div>
          </div>

          <div class="net-salary-wrap">
            <div class="net-row">
              <div class="net-label">Net Salary Payable ( A - B - C )</div>
              <div class="net-value">{payslip.net_salary:,.2f}</div>
            </div>
            <div class="net-row">
              <div class="net-label">Net Salary in words</div>
              <div class="net-words">{net_salary_words} Rupees only</div>
            </div>
          </div>

          <div class="note">
            <span>**Note :</span>&nbsp;&nbsp;<em>All amounts displayed in this payslip are in <strong>INR</strong></em>
          </div>

        </div>
        </body>
        </html>
        """
        return html
