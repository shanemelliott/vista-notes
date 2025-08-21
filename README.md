# VistA Notes - Appointment-Driven Clinical Note Writing System

A comprehensive web-based application for creating clinical notes in VistA through an appointment-driven workflow. This application integrates VistA RPC calls, FHIR R4 compliance, speech-to-text dictation, and AI-powered note enhancement to streamline clinical documentation.

## 🚀 Features

### **Appointment Integration**
- Automatically loads today's appointments from VistA using `SDES GET APPTS BY CLIN IEN 3` RPC
- FHIR R4 compliant appointment data format
- Click-to-select appointment workflow for note creation
- Dynamic clinic IEN and FileMan datetime integration

### **Note Creation**
- Direct integration with VistA TIU system using `TIU CREATE RECORD` RPC
- Appointment-driven note writing (no manual patient selection required)
- Multiple note title options (Attending Note, Primary Care Visit, etc.)
- Automatic visit information and encounter linking

### **Speech-to-Text Dictation**
- Browser-based speech recognition (Chrome, Edge, Safari)
- Continuous dictation with real-time transcription
- One-click start/stop microphone control
- Seamless integration with note editor

### **AI-Powered Note Enhancement**
- Azure OpenAI integration for note summarization and enhancement
- Configurable AI prompts for SOAP note formatting
- One-click note improvement and clinical language enhancement
- Maintains all original clinical details while improving structure

### **VistA Integration**
- Secure RPC connections to VistA systems
- Proper context switching for different VistA modules
- FileMan datetime conversion for appointment data
- Comprehensive error handling and validation

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Access to VistA system with appropriate RPC contexts
- Azure OpenAI API key (optional, for AI features)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/shanemelliott/vista-notes.git
cd vista-notes
```

2. Install dependencies:
```bash
npm install
```

3. Create configuration file:
```bash
cp config.sample.js config.js
```

4. Configure your VistA connection and settings in `config.js`:
```javascript
module.exports = {
    context: 'XUS SIGNON',
    host: 'your-vista-host.gov',
    port: 9094,
    accessCode: 'YOUR_ACCESS_CODE',
    verifyCode: 'YOUR_VERIFY_CODE',
    clinicIen: '195', // Your clinic IEN
    duz: 'YOUR_DUZ', // Your user DUZ
    AZURE_OPENAI_API_KEY: 'your-api-key', // Optional
    aiPrompt: 'Please summarize this clinical encounter in SOAP format'
};
```

### Running the Application
```bash
node index.js
```

Access the application at: `http://localhost:4567`

## Usage Workflow

### 1. **View Today's Appointments**
- Application automatically loads appointments for the configured clinic
- Appointments display patient name, time, and status
- FHIR R4 compliant data structure

### 2. **Select Patient via Appointment**
- Click on any appointment to select the patient
- Selected appointment highlights in blue
- Patient information and appointment details are captured

### 3. **Create Clinical Note**
- Select appropriate note title from dropdown
- Type or dictate note content using the microphone button
- Use "Summarize Note" for AI-enhanced formatting (optional)

### 4. **Save to VistA**
- Click "Save" to create the note in VistA
- Automatic visit creation with proper FileMan datetime
- Note linked to appointment encounter and clinic location

## Technical Architecture

### Backend (Node.js/Express)
- **VistA RPC Integration**: Direct communication with VistA using VistaJS library
- **FHIR R4 Compliance**: Appointment data served in FHIR Bundle format
- **AI Integration**: Azure OpenAI client for note enhancement
- **Error Handling**: Comprehensive validation and error responses

### Frontend (jQuery/Bootstrap)
- **Responsive Design**: Bootstrap-based UI for all device types
- **Real-time Updates**: Dynamic appointment loading and selection
- **Speech Recognition**: Browser Web Speech API integration
- **AJAX Communication**: Seamless client-server interaction

### Key Endpoints
- `GET /appointments` - FHIR R4 appointment bundle
- `POST /note` - Create note in VistA with appointment context
- `POST /ai-enhance` - AI-powered note enhancement
- `GET /noteTitles` - Available note types

## VistA Integration Details

### Required RPC Contexts
- `SDECRPC` - For appointment retrieval
- `OR CPRS GUI CHART` - For note creation and patient data

### RPC Calls Used
- `SDES GET APPTS BY CLIN IEN 3` - Retrieve clinic appointments
- `TIU CREATE RECORD` - Create clinical notes
- `ORQPT DEFAULT PATIENT LIST` - Patient lookup (legacy)

### Data Flow
1. **Appointment Data**: VistA → JSON cleaning → FHIR R4 transformation
2. **Note Creation**: Client → FileMan datetime conversion → VistA TIU
3. **AI Enhancement**: Note content → Azure OpenAI → Enhanced content

## Security & Configuration

### VistA Security
- Secure RPC connections with access/verify codes
- User-specific DUZ for proper attribution
- Context-specific operations for data access control

### Configuration Management
- Centralized config.js for all settings
- No hardcoded credentials or endpoints
- Environment-specific configuration support

## Error Handling

- **Appointment Loading**: Graceful fallback for RPC failures
- **Note Creation**: Validation for required fields and VistA connectivity
- **AI Integration**: Fallback for missing API keys or service issues
- **Speech Recognition**: Browser compatibility detection

## Browser Compatibility

### Full Support
- **Chrome/Chromium**: All features including speech recognition
- **Microsoft Edge**: Complete functionality
- **Safari**: Full support on recent versions

### Limited Support
- **Firefox**: Basic functionality (no speech recognition)
- **Mobile Browsers**: Touch-optimized interface

## Future Enhancements

- **Multiple Clinic Support**: Multi-clinic appointment viewing
- **Note Templates**: Predefined note structures
- **Signature Integration**: Electronic signature workflow
- **Audit Logging**: Comprehensive user activity tracking
- **Mobile App**: Native iOS/Android applications

## License

This project is developed for VistA integration and clinical workflow improvement. Please ensure compliance with your organization's policies regarding VistA system access and clinical data handling.

## Contributing

For issues, feature requests, or contributions, please contact the development team or submit issues through the appropriate channels.

---

**Note**: This application requires proper VistA system access and should only be used by authorized clinical personnel with appropriate system permissions. 
=======

There is now a basic user interface to demonstrate using RPCs to write notes. 

you can access at: http://localhost:4567 after launcing the node app. 
