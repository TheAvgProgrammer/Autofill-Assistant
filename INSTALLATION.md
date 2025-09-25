# Installation and Testing Guide

## Quick Start - Load Extension in Browser

### Chrome/Edge Installation

1. **Open Extension Management**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top right corner

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `Autofill-Assistant` directory (the one containing `manifest.json`)
   - The extension should appear in your extensions list

4. **Verify Installation**
   - Look for the extension icon in your browser toolbar
   - Click the icon to open the popup interface
   - You should see the four-tab interface: Actions, Profile, Templates, Settings

## Testing the Extension

### Test on Supported ATS Sites

The extension works best on these platforms:

- **Workday**: `*.workday.com`, `*myworkdayjobs.com`
- **Greenhouse**: `*.greenhouse.io`
- **Lever**: `*.lever.co`
- **iCIMS**: `*.icims.com`
- **Taleo**: `*.taleo.net`
- **BambooHR**: `*.bamboohr.com`
- **Jobvite**: `*.jobvite.com`
- **SmartRecruiters**: `*.smartrecruiters.com`
- **Generic Job Sites**: `jobs.*`, `careers.*`, `apply.*`

### Basic Testing Steps

1. **Set Up Profile**
   - Click the extension icon
   - Go to the "Profile" tab
   - Fill in your personal and work information
   - Click "Save Profile"

2. **Test ATS Detection**
   - Navigate to any job application site
   - Click the extension icon
   - Check the "Actions" tab to see if the ATS is detected
   - Confidence percentage should appear next to the ATS name

3. **Test Field Analysis**
   - On a job application form page
   - Click "Analyze Fields" in the extension popup
   - Review the detected fields in the summary

4. **Test Auto-Fill**
   - Click "Fill Form" to automatically populate detected form fields
   - Watch as fields are filled with natural timing

5. **Test Navigation**
   - Use "Next Step" to navigate multi-step application processes
   - Use "Screenshot" to capture application progress

### Template Testing

1. **View Templates**
   - Go to the "Templates" tab
   - Review pre-built answer templates
   - Edit templates to customize responses

2. **Add Custom Template**
   - Click "+ Add Template"
   - Create custom responses with variables like `{company}`, `{position}`
   - Save and test on forms with question fields

### Settings Configuration

1. **Review Settings**
   - Go to the "Settings" tab
   - Adjust timing delays if needed
   - Enable/disable features as desired

2. **API Configuration**
   - The extension includes a Gemini API key for enhanced field detection
   - For production use, replace with your own API key

## Troubleshooting

### Extension Won't Load
- Ensure you're selecting the correct directory (should contain `manifest.json`)
- Check browser console for any JavaScript errors
- Verify all required files are present

### ATS Not Detected
- Check if the site URL matches supported patterns
- Some sites use subdirectories or custom domains
- Extension will show "Unknown" but may still work

### Auto-Fill Not Working
- Ensure profile data is saved
- Some sites have non-standard form structures
- Check browser console for error messages
- Try "Analyze Fields" first to see what's detected

### Performance Issues
- The extension includes rate limiting for API calls
- Cache is used to improve performance
- Check the Settings tab for usage statistics

## Development and Customization

### Adding New ATS Support
1. Edit `src/lib/ats-detection/ats-detector.js`
2. Add URL patterns and DOM selectors for the new ATS
3. Update `src/lib/field-mapper/field-mapper.js` with field mappings
4. Test on the target ATS platform

### Customizing Field Detection
1. Modify heuristic patterns in `src/lib/field-mapper/field-mapper.js`
2. Add new field purposes as needed
3. Update profile structure if adding new data types

### Modifying UI
1. Edit `src/popup/popup.html` for structure changes
2. Update `src/popup/popup.css` for styling
3. Modify `src/popup/popup.js` for functionality changes

## Security Notes

- All data is stored locally using Chrome's storage API
- No data is transmitted to external servers (except LLM API calls)
- API keys should be rotated in production environments
- Users can export/import their data for backup

## Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Review the extension's activity log in the popup
3. Try disabling and re-enabling the extension
4. Reload the extension if you make code changes

For development questions or contributions, please refer to the main README.md file.