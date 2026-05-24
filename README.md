# Harvesting Machine Management System

A comprehensive web application for tracking and managing harvesting machine operations, fuel costs, and maintenance expenses. Built with Next.js, MongoDB, and shadcn/ui.

## Features

### 📊 Dashboard
- **Real-time Analytics**: View total hours harvested, diesel costs, and service expenses at a glance
- **Charts & Visualizations**: 
  - Harvesting hours by village (bar chart)
  - Monthly harvesting trends (line chart)
  - Cost breakdown pie chart
- **Key Metrics Cards**: Quick overview of all operational stats

### 🌾 Harvesting Records
- **Dual Time Tracking**:
  - Manual entry: Enter hours in decimal format (e.g., 2.5 = 2h 30m)
  - Timer mode: Auto-calculate hours with start/end time tracking
- **Farmer & Village Management**: Track harvest data by village and farmer name
- **CRUD Operations**: Create, read, update, and delete harvest records
- **Filtering**: Filter records by village for better organization
- **Date-based Tracking**: Record harvesting date for each session

### ⛽ Diesel Management
- **Fuel Tracking**: Record diesel purchases with litres, cost per litre
- **Automatic Calculation**: Total cost calculated automatically (Litres × Cost/Litre)
- **CRUD Operations**: Full transaction management for diesel entries
- **Village Filtering**: Track diesel costs by location
- **Summary Stats**: Total litres and total spent display

### 🔧 Services & Repairs
- **Maintenance Tracking**: Log all service, repair, and maintenance activities
- **Cost Management**: Track expenses for each service
- **CRUD Operations**: Manage service records with notes
- **Date Tracking**: Maintain service history timeline

### 📋 Reports & Analysis
- **Flexible Filtering**:
  - By village
  - By date range (start and end date)
  - By hourly rate (you set the rate)
- **Income Calculation**: 
  - Total hours harvested × hourly rate you input
- **Expense Summary**:
  - Diesel costs (auto-filtered by village & dates)
  - Service & repair costs
- **Profit Calculation**: Net profit = Income - Expenses
- **Print Reports**: Generate professional, printable reports with:
  - Detailed harvesting sessions
  - Diesel transactions
  - Financial summary
  - Income, expenses, and net profit

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: MongoDB with Mongoose ODM
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ or pnpm/npm installed
- MongoDB connection string (from MongoDB Atlas or local instance)

### Installation

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-client-id>
   ```

   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is required for Google signup/signin and for uploading reports to the signed-in user's Google Drive. Enable the Google Drive API for the Google Cloud project and add your app origin to the OAuth client's authorized JavaScript origins. A Google API key by itself cannot sign users in or upload/delete files in a user's Drive; the app uses the user's Google email after OAuth consent.

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. **Open in browser**:
   Navigate to `http://localhost:3000`

## Database Schema

### Harvesting Records
```javascript
{
  village: String (required),
  farmerName: String (required),
  date: Date (required),
  hoursWorked: Number (required),
  startTime: String (HH:MM format, optional),
  endTime: String (HH:MM format, optional),
  notes: String (optional),
  timestamps: true
}
```

### Diesel Records
```javascript
{
  village: String (required),
  date: Date (required),
  litres: Number (required),
  costPerLitre: Number (required),
  totalCost: Number (required),
  notes: String (optional),
  timestamps: true
}
```

### Service Records
```javascript
{
  date: Date (required),
  description: String (required),
  cost: Number (required),
  notes: String (optional),
  timestamps: true
}
```

## API Routes

All API endpoints support standard REST operations:

### Harvesting
- `GET /api/harvesting` - List all records (supports `?village=` and date filters)
- `POST /api/harvesting` - Create new record
- `GET /api/harvesting/[id]` - Get specific record
- `PATCH /api/harvesting/[id]` - Update record
- `DELETE /api/harvesting/[id]` - Delete record

### Diesel
- `GET /api/diesel` - List all records (supports filtering)
- `POST /api/diesel` - Create new record
- `GET /api/diesel/[id]` - Get specific record
- `PATCH /api/diesel/[id]` - Update record
- `DELETE /api/diesel/[id]` - Delete record

### Services
- `GET /api/service` - List all records
- `POST /api/service` - Create new record
- `GET /api/service/[id]` - Get specific record
- `PATCH /api/service/[id]` - Update record
- `DELETE /api/service/[id]` - Delete record

## Usage Guide

### Adding a Harvesting Record

1. Navigate to the **Harvesting** tab
2. Click **"Add Harvest"** button
3. Choose your time entry method:
   - **Manual Entry**: Enter hours in decimal format (1.5 = 1h 30m)
   - **Timer**: Use the built-in timer or manually set start/end times
4. Fill in village and farmer name
5. Click **"Save Record"**

### Adding Diesel Entry

1. Navigate to the **Diesel** tab
2. Click **"Add Diesel Entry"**
3. Fill in:
   - Village name
   - Date
   - Litres purchased
   - Cost per litre
   - Notes (optional)
4. Total cost calculates automatically
5. Click **"Save"**

### Adding Service/Repair

1. Navigate to the **Services** tab
2. Click **"Add Service"**
3. Fill in:
   - Date
   - Description (e.g., "Engine oil change")
   - Cost
   - Notes (optional)
4. Click **"Save"**

### Generating Reports

1. Navigate to the **Reports** tab
2. Set filters:
   - **Village**: Select which village to report on
   - **Start Date**: (Optional) Filter from this date
   - **End Date**: (Optional) Filter to this date
   - **Hourly Rate**: Enter your hourly harvesting rate in ₹
3. View the summary metrics:
   - Total Hours
   - Harvest Income (calculated)
   - Total Expenses
   - Net Profit
4. Click **"Print Report"** to generate a printable document

## Component Structure

```
/components
├── Dashboard.tsx          - Main dashboard with analytics
├── HarvestingRecords.tsx  - Harvesting records list & management
├── HarvestingForm.tsx     - Harvesting form with timer
├── DieselManagement.tsx   - Diesel tracking interface
├── ServiceRepairs.tsx     - Service/repair management
├── Reports.tsx            - Reports and printing
└── ui/                    - shadcn/ui components
```

## Utility Functions

Located in `/lib/timeUtils.ts`:
- `timeStringToDecimal()` - Convert HH:MM to decimal hours
- `decimalToTimeString()` - Convert decimal hours to HH:MM
- `calculateDuration()` - Calculate hours between two times
- `formatTime()` - Format hours for display

## Future Enhancements

- Export reports to PDF/Excel
- Equipment maintenance schedules
- Farmer payment tracking
- Multi-user support with roles
- Mobile app
- Data backup features
- Advanced analytics

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` in `.env.local`
- Check MongoDB Atlas IP whitelist includes your IP
- Ensure database user has proper permissions

### Form Not Submitting
- Check browser console for errors
- Verify all required fields are filled
- Check MongoDB connection

### Charts Not Displaying
- Ensure data exists in database
- Check browser console for errors
- Clear browser cache

## Support

For issues or questions, check the error messages in the browser console and verify:
1. MongoDB connection is working
2. All environment variables are set
3. All required fields in forms are filled
