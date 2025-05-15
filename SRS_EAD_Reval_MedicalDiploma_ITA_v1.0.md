# System Requirements Specification for Medical Diploma Revalidation E-Learning Platform

## 1. Introduction

### 1.1 Purpose

Define the functional and non-functional requirements for a web-based EAD (Educação a Distância) platform to support the revalidation of medical diplomas in Italy.

### 1.2 Scope

The system will allow medical professionals to register, access multilingual course content, take quizzes and simulados, submit assignments, participate in live sessions, and obtain validated certificates. Administrators and tutors will manage content, users, assessments, and reporting.

### 1.3 Definitions, Acronyms and Abbreviations

* **EAD**: Educação a Distância (Distance Learning)
* **MVP**: Minimum Viable Product
* **i18n**: Internationalization
* **LGPD/GDPR**: Brazilian and European data protection regulations

---

## 2. Overall Description

### 2.1 User Classes and Characteristics

* **Student**: Registers, studies courses, takes quizzes, submits assignments, views progress.
* **Tutor/Instructor**: Reviews submissions, grades essays, moderates forums, hosts live sessions.
* **Administrator**: Manages users, course content, system settings, integrations, and generates reports.

### 2.2 Operating Environment

* Modern browsers (Chrome, Firefox, Safari, Edge) on desktop, tablet, mobile
* AWS-hosted containers (Docker), Terraform-provisioned infrastructure
* PostgreSQL database, NestJS backend, Next.js frontend

### 2.3 Design & Implementation Constraints

* GDPR-compliant data storage in EU
* Responsive UI via Tailwind CSS
* TypeScript throughout (frontend & backend)
* CI/CD pipelines for automated testing and deployment

---

## 3. Functional Requirements

### 3.1 User Authentication & Authorization

* **FR-1**: Secure user registration, login, password reset
* **FR-2**: Role-based access control (Student, Tutor, Admin)

### 3.2 Student Dashboard & Progress Tracking

* **FR-3**: Display enrolled courses and completion percentage per module
* **FR-4**: Persist video view state and quiz results

### 3.3 Content Management & Delivery

* **FR-5**: Admin upload of video lectures (Hotmart/Panda/Vimeo integration) and PDFs
* **FR-6**: Student access to video player and downloadable materials

### 3.4 Assessments & Simulados

* **FR-7**: Multiple-choice quizzes with automatic grading
* **FR-8**: Essay/discursive submission with tutor review workflow
* **FR-9**: Video-based case presentations as assignments

### 3.5 Certificate Generation

* **FR-10**: Automatic issuance of completion certificates with QR-code verification

### 3.6 Discussion Forum

* **FR-11**: Threaded forum with topic creation, replies, and moderation
* **FR-12**: Notifications for new replies and tutor responses

### 3.7 Live Sessions & Webinars

* **FR-13**: Schedule and embed Zoom sessions within course modules
* **FR-14**: Recording access post-session

### 3.8 Payment & Enrollment via Webhooks

* **FR-15**: Integrate Hotmart webhook listener that captures `payment.completed` events, extracts student name and email, creates a user account, enrolls in the selected course, and triggers a welcome email with login credentials.
* **FR-16**: Integrate Asaas webhook listener with equivalent flow: on new successful payment, create student account and send login email.

### 3.9 Administrative Panel

* **FR-17**: CRUD operations for courses, modules, quizzes, users
* **FR-18**: Reporting dashboards for user activity, performance, and enrollment metrics

### 3.10 Interactive Flashcards Module

* **FR-19**: Interactive flashcards with front-and-back Q\&A view
* **FR-20**: Organization of flashcards by module or topic
* **FR-21**: Ability to mark cards as “difficult” or “mastered” for adaptive reinforcement
* **FR-22**: Self-directed access to flashcards independent of courses and quizzes
* **FR-23**: Simple, responsive interface optimized for quick review sessions
* **FR-24**: Individual progress tracking based on flashcards studied
* **FR-25**: Import and export of flashcards in Excel or CSV formats for collaboration with instructors
* **FR-17**: CRUD operations for courses, modules, quizzes, users
* **FR-18**: Reporting dashboards for user activity, performance, and enrollment metrics

---

## 4. Non-Functional Requirements

### 4.1 Performance

* **NFR-1**: Page load ≤ 2 seconds under normal load
* **NFR-2**: Support 1 000 concurrent users with auto-scaling

### 4.2 Reliability & Availability

* **NFR-3**: ≥ 99.5% uptime, with health checks and automated failover
* **NFR-4**: Daily backups of database and media assets

### 4.3 Security

* **NFR-5**: TLS encryption for all data in transit
* **NFR-6**: OWASP Top 10 protections (XSS, CSRF, SQL injection, etc.)
* **NFR-7**: GDPR/LGPD compliance: user consent, data access logs, deletion on request

### 4.4 Maintainability & Extensibility

* **NFR-8**: Modular code (DDD architecture) enabling microservice extraction
* **NFR-9**: Comprehensive unit and E2E test coverage (≥ 80%)

### 4.5 Usability

* **NFR-10**: WCAG 2.1 AA accessibility compliance
* **NFR-11**: Multilingual UI (pt-BR, it-IT, es-ES) via react-i18next

### 4.6 Scalability

* **NFR-12**: Containerized deployment (Docker) with Terraform-managed infra
* **NFR-13**: CI/CD pipeline for zero-downtime deployments

---

## 5. System Interfaces

### 5.1 External APIs

* **Hotmart Webhook API**: `payment.completed` event subscription for enrollment automation
* **Asaas Webhook API**: Payment success events for student creation and enrollment
* **Zoom REST API**: Scheduling and embedding live sessions
* **Panda/Vimeo API**: Video hosting and streaming

### 5.2 Internal APIs

* RESTful/NestJS endpoints for frontend consumption
* WebSocket or polling for real-time notifications

---

## 6. Data Requirements

### 6.1 Data Models

* **User**: id, name, email, role, language, enrolledCourses\[]
* **Course**: id, title, description, modules\[]
* **Module**: id, courseId, sequence, videoUrl, materials\[]
* **Quiz**: id, moduleId, questions\[]
* **Submission**: id, userId, moduleId, type (quiz/essay/video), timestamp, status
* **Certificate**: id, userId, courseId, issueDate, verificationCode

---

## 7. Constraints & Assumptions

* Client will provide Hotmart and Asaas accounts and configure webhook URLs.
* Brazilian client’s payment workflows rely on Asaas; Hotmart handles international sales.
* Initial MVP covers core features; mobile app or advanced AI features planned separately.

---

## 8. Future Enhancements

* Personalized AI recommendations (content & pacing)
* Mobile-native applications (iOS/Android)
* Internal chatbot for real-time student support
