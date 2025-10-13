# MCI Delivery Tracker

A comprehensive delivery management system with e-signature capabilities, real-time tracking, and complete delivery lifecycle management.

## 🚀 Features

### Core Functionality
- **📦 Delivery Management** - Create, track, and manage deliveries
- **🖊️ E-Signature Integration** - Complete digital signature workflow
- **📊 Real-time Dashboard** - Live analytics and metrics
- **📍 GPS Tracking** - Location-based delivery tracking
- **📋 Delivery History** - Complete audit trail of completed deliveries
- **📄 Export Capabilities** - PDF and Excel export functionality

### Advanced Features
- **🔄 Auto-refresh** - Real-time data updates
- **✅ Status Management** - Dynamic delivery status tracking
- **🏢 Customer Management** - Integrated customer database
- **🚛 Vehicle Tracking** - Truck and driver management
- **📱 Responsive Design** - Mobile-friendly interface
- **🔐 Data Persistence** - Reliable localStorage with backup

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Modern semantic markup
- **CSS3** - Responsive design with Bootstrap 5
- **JavaScript (ES6+)** - Modern JavaScript features
- **Bootstrap 5** - UI framework
- **Leaflet.js** - Interactive maps
- **Chart.js** - Data visualization

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Local Storage** - Client-side data persistence
- **File System** - Local file operations

### Libraries & Dependencies
- **Bootstrap Icons** - Icon library
- **Signature Pad** - Digital signature capture
- **XLSX** - Excel file processing
- **Leaflet** - Map functionality

## 📁 Project Structure

```
mci-delivery-tracker/
├── public/                     # Frontend assets
│   ├── assets/
│   │   ├── css/               # Stylesheets
│   │   │   ├── style.css      # Main styles
│   │   │   └── leaflet.css    # Map styles
│   │   └── js/                # JavaScript files
│   │       ├── app.js         # Main application logic
│   │       ├── booking.js     # Booking management
│   │       ├── calendar.js    # Calendar functionality
│   │       ├── customers.js   # Customer management
│   │       ├── analytics.js   # Analytics and reporting
│   │       ├── warehouse.js   # Warehouse management
│   │       ├── e-signature.js # E-signature functionality
│   │       ├── delivery-history-fix.js # Delivery history fixes
│   │       ├── signature-completion-fix.js # Signature completion fixes
│   │       └── minimal-booking-fix.js # Booking system fixes
│   └── index.html             # Main application page
├── docs/                      # Documentation
├── tests/                     # Test files
├── scripts/                   # Build and deployment scripts
├── package.json              # Node.js dependencies
├── README.md                 # This file
└── .gitignore               # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johnmangawang-git/mci-delivery-tracker.git
   cd mci-delivery-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   ./start-dev.sh  # Linux/Mac
   ./start-dev.bat # Windows
   ```

4. **Open your browser**
   ```
   http://localhost:8086
   ```

## 📖 Usage Guide

### Creating a New Delivery
1. Navigate to **Active Deliveries**
2. Click **"Add New Booking"**
3. Fill in delivery details:
   - DR Number
   - Customer Information
   - Pickup and Delivery Locations
   - Vehicle Information
4. Click **"Save Booking"**

### E-Signature Process
1. Select delivery from **Active Deliveries**
2. Click **"E-Signature"** button
3. Complete the digital signature
4. Click **"Save Signature"**
5. Delivery automatically moves to **Delivery History**

### Viewing Reports
1. Navigate to **Analytics** section
2. View real-time metrics and charts
3. Export data using **Export** buttons
4. Generate PDF reports for completed deliveries

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=8086
NODE_ENV=development
```

### Local Storage Keys
The application uses these localStorage keys:
- `mci-active-deliveries` - Active delivery data
- `mci-delivery-history` - Completed delivery history
- `ePodRecords` - E-signature records
- `mci-customers` - Customer database

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Files Available
- `test-final-delivery-history-fix.html` - Delivery history functionality
- `test-signature-completion-fix.html` - E-signature process
- `debug-missing-delivery.html` - Diagnostic tools

### Manual Testing
1. Open test files in browser
2. Follow on-screen instructions
3. Verify functionality works as expected

## 🐛 Troubleshooting

### Common Issues

**Deliveries not appearing in history after signature:**
- Check browser console for errors
- Verify localStorage is enabled
- Run diagnostic: `delivery-history-diagnostic.js`

**Signature pad not working:**
- Ensure modern browser support
- Check for JavaScript errors
- Verify signature-completion-fix.js is loaded

**Data not persisting:**
- Check localStorage quota
- Verify browser permissions
- Clear cache and reload

### Debug Tools
- Browser Developer Tools (F12)
- Console diagnostic scripts
- Test HTML files for isolated testing

## 📊 Performance

### Optimization Features
- **Lazy Loading** - Components load on demand
- **Data Caching** - localStorage for offline capability
- **Efficient Rendering** - Minimal DOM manipulation
- **Responsive Design** - Mobile-optimized

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🔐 Security

### Data Protection
- Client-side data encryption
- Secure signature storage
- Input validation and sanitization
- XSS protection

### Best Practices
- Regular security updates
- Secure coding practices
- Data backup procedures
- Access control measures

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- ES6+ JavaScript
- Semantic HTML5
- Mobile-first CSS
- Comprehensive comments
- Error handling

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Complete delivery management system
- ✅ E-signature integration
- ✅ Real-time dashboard
- ✅ Export functionality
- ✅ Mobile responsive design
- ✅ Comprehensive bug fixes

### Recent Fixes
- ✅ **Delivery History Fix** - Signed deliveries now properly save to history
- ✅ **Signature Completion** - Enhanced e-signature process
- ✅ **Checkbox Persistence** - Selections survive auto-refresh
- ✅ **Vendor Number Display** - Proper field labeling
- ✅ **Data Integrity** - Bulletproof data handling

## 📞 Support

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/johnmangawang-git/mci-delivery-tracker/issues)
- **Documentation**: Check `/docs` folder
- **Diagnostics**: Use provided debug tools

### Reporting Bugs
1. Check existing issues
2. Provide detailed description
3. Include browser/OS information
4. Add steps to reproduce
5. Include error messages/screenshots

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bootstrap team for the UI framework
- Leaflet.js for mapping capabilities
- All contributors and testers
- Open source community

---

**Built with ❤️ for efficient delivery management**

For more information, visit: [GitHub Repository](https://github.com/johnmangawang-git/mci-delivery-tracker)