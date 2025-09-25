# Browser Autofill Assistant

An intelligent Chrome/Edge extension that automatically detects and fills career/job application forms across major Applicant Tracking Systems (ATS).

## 🎯 Features

- **Multi-ATS Support**: Works with Workday, Greenhouse, Lever, iCIMS, Taleo, BambooHR, Jobvite, SmartRecruiters, and more
- **Smart Field Detection**: Intelligent field mapping with fallback to AI-powered analysis
- **Profile Management**: Store and reuse candidate profiles and Q&A templates
- **File Upload Handling**: Automated resume and cover letter uploads
- **Step Navigation**: Orchestrated multi-step form completion
- **Activity Logging**: Screenshot and DOM capture for submission tracking

## 🚀 Installation

### Chrome/Edge Extension Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/TheAvgProgrammer/Autofill-Assistant.git
   cd Autofill-Assistant
   ```

2. **Load in Browser**
   - Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the extension directory
   - The extension icon should appear in your browser toolbar

### API Configuration

1. **Gemini LLM Setup** (Optional for advanced field detection)
   - The extension includes a Gemini API key for fallback field detection
   - For production use, replace with your own API key in `src/lib/llm/gemini-client.js`

## 📖 Usage

### Basic Operation

1. **Setup Profile**
   - Click the extension icon in your browser toolbar
   - Select "Use Profile" to configure your candidate information
   - Save personal details, work history, and common answers

2. **Auto-Fill Applications**
   - Navigate to any supported job application site
   - The extension automatically detects ATS systems
   - Click "Fill" in the popup to auto-populate form fields
   - Use "Next Step" to navigate multi-page applications
   - Click "Submit" when ready to submit the application

3. **File Uploads**
   - Extension will prompt for resume/cover letter uploads when detected
   - Pre-configure file paths in your profile for faster uploads

### Supported ATS Platforms

- **Workday** (`*.workday.com`, `*myworkdayjobs.com`)
- **Greenhouse** (`*.greenhouse.io`)
- **Lever** (`*.lever.co`)
- **iCIMS** (`*.icims.com`)
- **Taleo** (`*.taleo.net`)
- **BambooHR** (`*.bamboohr.com`)
- **Jobvite** (`*.jobvite.com`)
- **SmartRecruiters** (`*.smartrecruiters.com`)
- **Generic Job Sites** (`jobs.*`, `careers.*`, `apply.*`)

## 🏗️ Architecture

### Project Structure

```
src/
├── background/           # Service worker for orchestration
│   └── service-worker.js
├── content/             # Content scripts for DOM interaction
│   └── content-script.js
├── popup/               # Extension popup UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── lib/                 # Core libraries
│   ├── ats-detection/   # ATS platform detection
│   ├── field-mapper/    # Field mapping rules
│   ├── answer-library/  # Q&A template management
│   ├── storage/         # Data persistence
│   └── llm/            # AI integration
└── assets/             # Static resources
    ├── css/
    └── icons/
```

### Key Components

1. **Background Service Worker**: Orchestrates form filling, manages profiles, and coordinates between components

2. **Content Script**: Detects ATS platforms, analyzes DOM structure, performs autofill operations, and handles navigation

3. **Field Mapper**: Contains platform-specific rules and heuristic-based field detection with AI fallback

4. **Answer Library**: Manages templates for recurring questions and custom responses

## 🔧 Development

### Code Structure

- **Modular Design**: Each component is self-contained with clear interfaces
- **Vanilla JavaScript**: No external frameworks for maximum compatibility
- **Comprehensive Comments**: Detailed documentation throughout the codebase
- **TODO Markers**: Clear indicators for future enhancements

### Extending Support

1. **Adding New ATS Platforms**
   - Update `manifest.json` with new URL patterns
   - Add detection rules in `src/lib/ats-detection/ats-detector.js`
   - Create field mapping rules in `src/lib/field-mapper/`

2. **Custom Field Detection**
   - Extend heuristic rules in `field-mapper.js`
   - Modify LLM integration for complex cases

### Testing

- Load the extension in developer mode
- Test on various ATS demo sites
- Verify form field detection and filling
- Check file upload functionality

## 🔒 Privacy & Security

- All data stored locally using Chrome's storage API
- No data transmitted to external servers (except LLM API calls)
- Screenshot data captured only for user's local records
- API keys should be rotated in production environments

## 📝 TODO & Future Enhancements

- [ ] Enhanced AI integration for complex form layouts
- [ ] Backend event logging and analytics
- [ ] Multi-language support
- [ ] Advanced field validation
- [ ] Bulk application management
- [ ] Integration with job boards and LinkedIn
- [ ] Machine learning for improved field detection
- [ ] A/B testing for form completion strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper comments and documentation
4. Test thoroughly across different ATS platforms
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is for legitimate job application purposes only. Users are responsible for ensuring compliance with website terms of service and applicable laws. Always review auto-filled information before submission.