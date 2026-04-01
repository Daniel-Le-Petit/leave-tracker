# Leave Tracker

![Leave Tracker](https://img.shields.io/badge/Leave_Tracker-v1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Description

**Leave Tracker** is a comprehensive web application for tracking and managing employee leave (vacation days, RTT, and CET). It provides detailed analytics, calendar views, payroll validation, and automated reporting features.

### ✨ Main Features

- 📊 **Dashboard** with real-time leave balance tracking
- 📅 **Interactive Calendar** with visual leave planning
- 💼 **Payroll Validation** to verify leave against pay slips
- 📧 **Vacation Report** to generate and send leave reports
- 📈 **Analytics & Charts** with monthly and cumulative visualizations
- 🔄 **Carryover Management** for year-end leave rollover
- 📱 **Responsive Design** (mobile and desktop)
- 🌙 **Dark Mode** support
- 💾 **Local Storage** using Dexie (IndexedDB)
- 📤 **Export/Import** functionality for data backup

## 🚀 Quick Start

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd leave-tracker

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Static Export

```bash
# Build and export static files
npm run build
```

Static files will be generated in the `out` directory.

## 📁 Project Structure

```
leave-tracker/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Dashboard page
│   │   ├── calendar/          # Calendar view
│   │   ├── payroll/           # Payroll validation
│   │   ├── vacation-report/   # Vacation report
│   │   ├── comparison/        # Leave comparison
│   │   ├── carryover/         # Carryover management
│   │   ├── history/           # Leave history
│   │   └── settings/          # Application settings
│   ├── components/            # React components
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── services/              # External services
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── package.json              # Project dependencies

```

## 🛠️ Technologies Used

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18, Tailwind CSS
- **Icons**: Lucide React
- **Database**: Dexie (IndexedDB wrapper)
- **Charts**: Chart.js, react-chartjs-2
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast
- **PDF Export**: jsPDF, html2canvas

## 📝 Features in Detail

### Dashboard
- Overview of leave balances (RTT, CP, CET)
- Monthly leave distribution charts
- Cumulative progression tracking
- Quick statistics and alerts

### Calendar
- Month/week/day view
- Drag-and-drop leave planning
- Color-coded leave types
- Public holiday integration

### Payroll Validation
- Compare tracked leaves against pay slips
- Identify discrepancies
- Month-by-month validation
- Detailed inconsistency reports

### Vacation Report
- Select leaves for reporting
- Email preview generation
- Filter by type and date range
- Convert forecasts to actual leaves

### Analytics
- Comprehensive leave analytics
- Trend analysis
- Comparison tools
- Export capabilities

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_APP_NAME=Leave Tracker
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📦 Deployment

### Render (Static Site)

1. Connect your GitHub repository to Render
2. Use the following build settings:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `out`

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Daniel Le Petit

## 🐛 Support

For issues and questions, please open an issue on GitHub.



