# PD Schedule Manager

A professional development schedule management application built with Angular that helps track and manage schedules on PagerDuty with powerful Excel export capabilities.

## Features

- Schedule management with date range filtering
- Excel export functionality with detailed and summary views
- Token-based authentication
- Interactive date selection
- Loading state management

## Excel Export Feature

The application provides a comprehensive Excel export functionality that generates a workbook with two worksheets:

### 1. Detailed Worksheet
Contains day-by-day schedule information including:
- Date
- Name
- Week number
- Daily payment
- Month

### 2. Summary Worksheet
Provides a financial overview with:
- Names listed vertically
- Months listed horizontally
- Payment totals for each person per month
- Row totals showing total payment per person
- Column totals showing total payment per month
- Grand total in the bottom right corner

## How to Use

1. Enter your authentication token
2. Select the date range using the from and to date fields
3. (Optional) Enter a specific ID if needed
4. Click "Get Schedules" to fetch the schedule data
5. Once the data is loaded, click "Export to Excel" to generate the Excel file
6. The Excel file will be automatically downloaded as "PD_schedules.xlsx"

## Data Structure

### Schedule Entry
Each schedule entry contains:
- Start date/time
- End date/time
- User information
- Payment information (default: 35.71 per day)

### Excel Output
The generated Excel file provides two views:
1. Detailed daily breakdown of schedules
2. Monthly summary of payments by person

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- Angular CLI (v19.0.0)

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm start
```
4. Navigate to `http://localhost:4200` in your browser

### Build
To build the project for production:
```bash
npm run build
```
The build artifacts will be stored in the `dist/` directory.

### Technology Stack
- Angular 19
- Angular Material UI
- RxJS for reactive programming
- XLSX library for Excel export functionality

### Project Structure
```
pd-schedule-app/
├── src/                    # Source files
│   ├── app/               # Application components
│   ├── environments/      # Environment configurations
│   └── assets/           # Static assets
├── public/               # Public assets
└── package.json          # Project dependencies and scripts
```

## Development

This project was generated with Angular CLI. To run the development server:

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/` to access the application.
