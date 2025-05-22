from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import os
import time
import logging
import io
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from dotenv import load_dotenv

# Import our scheduling algorithm module
from scheduler import generate_schedule, validate_constraints

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Scheduler API is running"}), 200

@app.route('/api/generate-schedule', methods=['POST'])
def create_schedule():
    """Generate a new schedule based on provided constraints"""
    try:
        start_time = time.time()
        logger.info("Received schedule generation request")

        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Log the input data size
        logger.info(f"Input data: {len(str(data))} bytes")

        # Generate the schedule using our algorithm
        schedule = generate_schedule(data)

        # Check if this is an error schedule (by looking at the scheduleId pattern)
        is_error = schedule.get("scheduleId", "").startswith("error-schedule-")

        # Calculate execution time
        execution_time = time.time() - start_time
        logger.info(f"Schedule generated in {execution_time:.2f} seconds with {len(schedule['entries'])} entries")

        if is_error:
            response = {
                "status": "error",
                "message": f"Failed to generate schedule: the settings provided are not valid or could not create a feasible schedule.",
                "data": schedule
            }
            return jsonify(response), 400
        else:
            response = {
                "status": "success",
                "message": f"Schedule generated successfully in {execution_time:.2f} seconds",
                "data": schedule
            }
            return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error generating schedule: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/validate-constraints', methods=['POST'])
def validate_constraints_endpoint():
    """Validate if the provided constraints can lead to a feasible schedule"""
    try:
        start_time = time.time()
        logger.info("Received constraint validation request")

        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Validate the constraints
        validation_result = validate_constraints(data)

        # Calculate execution time
        execution_time = time.time() - start_time
        logger.info(f"Constraints validated in {execution_time:.2f} seconds")

        response = {
            "status": "success",
            "message": f"Constraints validated in {execution_time:.2f} seconds",
            "feasible": validation_result.get("feasible", False),
            "issues": validation_result.get("issues", [])
        }

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error validating constraints: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

def filter_weekdays(schedule):
    """Filter schedule to only include Monday to Friday"""
    weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
    filtered_entries = [entry for entry in schedule["entries"] if entry["day"] in weekdays]
    return {"scheduleId": schedule["scheduleId"], "entries": filtered_entries}

def create_pdf(schedule, class_filter=None, include_breaks=True):
    """Generate a PDF of the schedule"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []

    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        spaceAfter=0.3*inch
    )

    # Filter by class if specified
    if class_filter:
        filtered_entries = [entry for entry in schedule["entries"] if entry["classId"] == class_filter]
        title = f"Class Schedule: {class_filter}"
    else:
        filtered_entries = schedule["entries"]
        title = "School Master Schedule"

    # Add title
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 0.2*inch))

    # Filter to only include Monday-Friday
    weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
    filtered_entries = [entry for entry in filtered_entries if entry["day"] in weekdays]

    # Group entries by time slot and day
    time_slots = sorted(set([(entry["startTime"], entry["endTime"]) for entry in filtered_entries]))
    days = weekdays

    # Create data for the table
    data = [["TIME"] + days]

    # Find breakfast and lunch breaks
    breakfast_slots = {}
    lunch_slots = {}
    if include_breaks:
        for entry in filtered_entries:
            if entry.get("isBreak") and entry.get("breakType") == "breakfast":
                time_key = (entry["startTime"], entry["endTime"])
                day_key = entry["day"]
                if time_key not in breakfast_slots:
                    breakfast_slots[time_key] = set()
                breakfast_slots[time_key].add(day_key)
            elif entry.get("isBreak") and entry.get("breakType") == "lunch":
                time_key = (entry["startTime"], entry["endTime"])
                day_key = entry["day"]
                if time_key not in lunch_slots:
                    lunch_slots[time_key] = set()
                lunch_slots[time_key].add(day_key)

    # Add rows for each time slot
    for time_slot in time_slots:
        start_time, end_time = time_slot
        row = [f"{start_time} - {end_time}"]

        # Check if this is a break slot
        is_breakfast = time_slot in breakfast_slots
        is_lunch = time_slot in lunch_slots

        for day in days:
            # Find entries for this time slot and day
            day_entries = [e for e in filtered_entries if e["startTime"] == start_time and e["day"] == day]

            if day_entries:
                entry = day_entries[0]  # Take the first entry if multiple exist
                if entry.get("isBreak"):
                    if entry.get("breakType") == "breakfast":
                        cell_text = "🍳 Breakfast Break"
                    elif entry.get("breakType") == "lunch":
                        cell_text = "🍽️ Lunch Break"
                    else:
                        cell_text = "Break"
                else:
                    subject_id = entry["subjectId"]
                    teacher_id = entry["teacherId"]
                    cell_text = f"{subject_id}\n{teacher_id}"
                row.append(cell_text)
            else:
                # Check if this should be a break based on other classes
                if is_breakfast and day in breakfast_slots.get(time_slot, set()):
                    row.append("🍳 Breakfast Break")
                elif is_lunch and day in lunch_slots.get(time_slot, set()):
                    row.append("🍽️ Lunch Break")
                else:
                    row.append("")

        data.append(row)

    # Create the table
    table = Table(data, colWidths=[1.2*inch] + [1.5*inch]*len(days))

    # Style the table
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (0, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ])

    # Add special styling for breaks
    for i, row in enumerate(data):
        if i == 0:  # Skip header row
            continue

        for j, cell in enumerate(row):
            if j == 0:  # Skip time column
                continue

            if "Breakfast Break" in cell:
                style.add('BACKGROUND', (j, i), (j, i), colors.lightblue)
            elif "Lunch Break" in cell:
                style.add('BACKGROUND', (j, i), (j, i), colors.lightyellow)

    table.setStyle(style)
    elements.append(table)

    # Build the PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def create_excel(schedule, class_filter=None, include_breaks=True):
    """Generate an Excel file of the schedule"""
    # Filter by class if specified
    if class_filter:
        filtered_entries = [entry for entry in schedule["entries"] if entry["classId"] == class_filter]
    else:
        filtered_entries = schedule["entries"]

    # Filter to only include Monday-Friday
    weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
    filtered_entries = [entry for entry in filtered_entries if entry["day"] in weekdays]

    # Group entries by time slot and day
    time_slots = sorted(set([(entry["startTime"], entry["endTime"]) for entry in filtered_entries]))
    days = weekdays

    # Create DataFrame
    data = []

    # Find breakfast and lunch breaks
    breakfast_slots = {}
    lunch_slots = {}
    if include_breaks:
        for entry in filtered_entries:
            if entry.get("isBreak") and entry.get("breakType") == "breakfast":
                time_key = (entry["startTime"], entry["endTime"])
                day_key = entry["day"]
                if time_key not in breakfast_slots:
                    breakfast_slots[time_key] = set()
                breakfast_slots[time_key].add(day_key)
            elif entry.get("isBreak") and entry.get("breakType") == "lunch":
                time_key = (entry["startTime"], entry["endTime"])
                day_key = entry["day"]
                if time_key not in lunch_slots:
                    lunch_slots[time_key] = set()
                lunch_slots[time_key].add(day_key)

    # Add rows for each time slot
    for time_slot in time_slots:
        start_time, end_time = time_slot
        row = {"TIME": f"{start_time} - {end_time}"}

        # Check if this is a break slot
        is_breakfast = time_slot in breakfast_slots
        is_lunch = time_slot in lunch_slots

        for day in days:
            # Find entries for this time slot and day
            day_entries = [e for e in filtered_entries if e["startTime"] == start_time and e["day"] == day]

            if day_entries:
                entry = day_entries[0]  # Take the first entry if multiple exist
                if entry.get("isBreak"):
                    if entry.get("breakType") == "breakfast":
                        cell_text = "Breakfast Break"
                    elif entry.get("breakType") == "lunch":
                        cell_text = "Lunch Break"
                    else:
                        cell_text = "Break"
                else:
                    subject_id = entry["subjectId"]
                    teacher_id = entry["teacherId"]
                    cell_text = f"{subject_id} - {teacher_id}"
                row[day] = cell_text
            else:
                # Check if this should be a break based on other classes
                if is_breakfast and day in breakfast_slots.get(time_slot, set()):
                    row[day] = "Breakfast Break"
                elif is_lunch and day in lunch_slots.get(time_slot, set()):
                    row[day] = "Lunch Break"
                else:
                    row[day] = ""

        data.append(row)

    # Create DataFrame and Excel file
    df = pd.DataFrame(data)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Schedule', index=False)

        # Get the xlsxwriter workbook and worksheet objects
        workbook = writer.book
        worksheet = writer.sheets['Schedule']

        # Add formats for breaks
        breakfast_format = workbook.add_format({'bg_color': '#ADD8E6'})  # Light blue
        lunch_format = workbook.add_format({'bg_color': '#FFFFE0'})  # Light yellow

        # Apply conditional formatting
        for col_num, col_name in enumerate(df.columns):
            if col_name != 'TIME':
                # Format breakfast breaks
                worksheet.conditional_format(
                    1, col_num + 1, len(df), col_num + 1,
                    {'type': 'text',
                     'criteria': 'containing',
                     'value': 'Breakfast',
                     'format': breakfast_format}
                )

                # Format lunch breaks
                worksheet.conditional_format(
                    1, col_num + 1, len(df), col_num + 1,
                    {'type': 'text',
                     'criteria': 'containing',
                     'value': 'Lunch',
                     'format': lunch_format}
                )

        # Auto-adjust column widths
        for i, col in enumerate(df.columns):
            column_width = max(df[col].astype(str).map(len).max(), len(col)) + 2
            worksheet.set_column(i, i, column_width)

    buffer.seek(0)
    return buffer

@app.route('/api/export/pdf', methods=['POST'])
def export_pdf():
    """Export schedule as PDF"""
    try:
        data = request.json
        if not data or 'schedule' not in data:
            return jsonify({"status": "error", "message": "No schedule data provided"}), 400

        schedule = data['schedule']
        class_filter = data.get('classId')  # Optional class filter
        include_breaks = data.get('includeBreaks', True)

        # Generate PDF
        pdf_buffer = create_pdf(schedule, class_filter, include_breaks)

        # Return the PDF file
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"schedule-{schedule['scheduleId']}.pdf"
        )

    except Exception as e:
        logger.error(f"Error exporting PDF: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/export/excel', methods=['POST'])
def export_excel():
    """Export schedule as Excel"""
    try:
        data = request.json
        if not data or 'schedule' not in data:
            return jsonify({"status": "error", "message": "No schedule data provided"}), 400

        schedule = data['schedule']
        class_filter = data.get('classId')  # Optional class filter
        include_breaks = data.get('includeBreaks', True)

        # Generate Excel
        excel_buffer = create_excel(schedule, class_filter, include_breaks)

        # Return the Excel file
        return send_file(
            excel_buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"schedule-{schedule['scheduleId']}.xlsx"
        )

    except Exception as e:
        logger.error(f"Error exporting Excel: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
