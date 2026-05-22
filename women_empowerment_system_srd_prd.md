# SOFTWARE REQUIREMENTS DOCUMENT (SRD)

# Women Empowerment Monitoring and Evaluation System

---

# 1. Introduction

## 1.1 Background of the Study
Women empowerment programs play an important role in improving the social and economic lives of women through education, skills training, entrepreneurship support, and community development activities. Many organizations and NGOs manage these programs manually using paper files and spreadsheets, which often leads to poor record management, data loss, slow reporting, and difficulties in monitoring participant progress.

The Women Empowerment Monitoring and Evaluation System is designed to digitize these activities by providing a web-based platform for registering participants, managing trainings, monitoring progress, and generating evaluation reports.

---

## 1.2 Purpose of the System
The purpose of this system is to provide an efficient computerized solution for monitoring and evaluating women empowerment programs.

The system aims to:
- Improve data management
- Reduce paperwork
- Simplify participant tracking
- Improve report generation
- Support better decision making

---

## 1.3 Scope of the System
The system will allow administrators and staff members to:
- Register women participants
- Manage training programs
- Record attendance
- Monitor participant progress
- Evaluate empowerment activities
- Generate reports and statistics

The project will be developed as a web application.

---

## 1.4 Technologies Used

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Styling | Tailwind CSS v3 |

The user interface styling should be implemented with Tailwind CSS v3, using utility classes and custom styles defined through the standard `@tailwind base`, `@tailwind components`, and `@tailwind utilities` directives.

---

# 2. System Overview

The Women Empowerment Monitoring and Evaluation System is a web-based application that helps organizations manage women empowerment activities digitally.

The system provides centralized storage of participant records, training information, attendance tracking, monitoring activities, and evaluation reports.

---

# 3. Functional Requirements

## 3.1 User Authentication Module
The system shall:
- Allow users to log in securely
- Allow users to log out
- Support role-based access control
- Restrict unauthorized access

---

## 3.2 Participant Management Module
The system shall:
- Register participants
- Edit participant information
- Delete participant records
- View participant details
- Search participants

### Participant Information
- Full name
- Age
- Address
- Phone number
- Education level
- Occupation

---

## 3.3 Training Management Module
The system shall:
- Add training programs
- Edit training details
- Assign trainers
- Store training schedules
- Manage attendance records

### Training Information
- Training title
- Trainer name
- Training date
- Location
- Description

---

## 3.4 Monitoring Module
The system shall:
- Track participant attendance
- Monitor participant progress
- Record achievements
- Store follow-up activities

---

## 3.5 Evaluation Module
The system shall:
- Generate evaluation reports
- Display statistics and charts
- Analyze participant progress
- Evaluate program performance

---

# 4. Non-Functional Requirements

## 4.1 Performance Requirements
- The system should load pages within 3 seconds.
- The system should support multiple users simultaneously.

---

## 4.2 Security Requirements
- Passwords must be encrypted.
- Users should access only authorized modules.
- The system should protect stored data.

---

## 4.3 Usability Requirements
- The system interface should be user-friendly.
- Navigation should be simple and clear.
- Forms should be easy to use.

---

## 4.4 Reliability Requirements
- The system should operate continuously without major failures.
- Data should be stored safely in the database.

---

# 5. System Users

| User Role | Responsibilities |
|---|---|
| Administrator | Manage users and system data |
| Project Manager | Monitor activities and view reports |
| Trainer | Manage training attendance |
| Staff | Register participants and update records |

---

# 6. Database Requirements

## Main Tables

### users
- id
- username
- password
- role

### participants
- id
- full_name
- age
- address
- phone_number
- education_level
- occupation

### trainings
- id
- title
- trainer_name
- date
- location
- description

### attendance
- id
- participant_id
- training_id
- status

### evaluations
- id
- participant_id
- progress
- remarks

---

# 7. System Architecture

```text
React Frontend
       ↓
Node.js + Express Backend
       ↓
PostgreSQL Database
```

---

# 8. Expected Outputs

The system should generate:
- Participant records
- Attendance reports
- Training reports
- Progress reports
- Evaluation reports
- Dashboard statistics

---

# 9. Advantages of the System

- Reduces paperwork
- Improves data management
- Simplifies monitoring activities
- Generates reports quickly
- Improves decision making
- Saves time and resources

---

# 10. Conclusion

The Women Empowerment Monitoring and Evaluation System will help organizations manage empowerment programs efficiently through digital technology. The system improves monitoring, evaluation, and reporting processes while reducing manual work.



# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Women Empowerment Monitoring and Evaluation System

---

# 1. Product Overview

The Women Empowerment Monitoring and Evaluation System is a web-based application developed to help organizations digitally manage women empowerment programs.

The system allows organizations to register participants, manage trainings, monitor activities, and evaluate program outcomes through reports and statistics.

---

# 2. Problem Statement

Many organizations still use manual methods such as paper files and spreadsheets to manage women empowerment programs.

This creates several challenges including:
- Data loss
- Poor record management
- Slow report generation
- Difficult monitoring processes
- Inaccurate evaluations

The proposed system solves these problems by automating the management and monitoring process.

---

# 3. Project Goals

The main goals of the system are:
- To digitize participant records
- To improve monitoring efficiency
- To simplify evaluation processes
- To generate reports automatically
- To improve data accessibility

---

# 4. Objectives

## General Objective
To develop a computerized system for monitoring and evaluating women empowerment programs.

## Specific Objectives
- To register women participants digitally
- To manage training programs efficiently
- To track attendance and progress
- To generate evaluation reports
- To improve record keeping and reporting

---

# 5. Target Users

The system targets:
- NGOs
- Community organizations
- Women empowerment projects
- Project managers
- Trainers
- Administrative staff

---

# 6. Product Features

## 6.1 Authentication
- User login
- User logout
- Role-based access control

---

## 6.2 Participant Management
- Add participant
- Edit participant
- Delete participant
- View participant list
- Search participants

---

## 6.3 Training Management
- Create training sessions
- Assign trainers
- Manage attendance
- Update training schedules

---

## 6.4 Monitoring Module
- Track participant progress
- Monitor activities
- Record achievements

---

## 6.5 Evaluation and Reporting
- Generate reports
- View statistics
- Display dashboard charts
- Export reports

---

# 7. User Stories

## Administrator
“As an administrator, I want to manage users and participants so that I can control system operations.”

## Trainer
“As a trainer, I want to record attendance so that I can monitor participant involvement.”

## Project Manager
“As a project manager, I want to generate reports so that I can evaluate program success.”

## Staff Member
“As a staff member, I want to register participants so that participant information can be stored digitally.”

---

# 8. Technical Requirements

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Styling | Tailwind CSS v3 |
| API Testing | Postman |
| Version Control | Git and GitHub |

---

# 9. Product Workflow

```text
User Login
     ↓
Register Participants
     ↓
Create Training Programs
     ↓
Track Attendance and Progress
     ↓
Generate Reports and Evaluation
```

---

# 10. Success Criteria

The project will be considered successful if:
- Users can log in successfully
- Participants are registered correctly
- Trainings are managed properly
- Attendance is tracked accurately
- Reports are generated automatically
- Data is stored securely in PostgreSQL

---

# 11. Constraints

- Requires internet connection
- Requires user authentication
- Depends on server availability

---

# 12. Future Improvements

- Email notifications
- Advanced dashboard analytics
- Cloud deployment
- Export reports to PDF and Excel
- Real-time monitoring reports

---

# 13. Conclusion

The Women Empowerment Monitoring and Evaluation System will improve the efficiency of organizations involved in women empowerment activities. By replacing manual processes with a computerized system, the project will support better monitoring, evaluation, reporting, and decision making.

