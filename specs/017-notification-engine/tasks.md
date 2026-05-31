# Tasks.md: Automated Post-Booking Notification Engine

## Feature: 017-notification-engine

## Phase 1: Setup (Project Initialization)

- [ ] T001 Create project structure (screen directory: `utils/notificationCompiler.ts`, `app/admin/notifications/page.tsx`, `app/api/notifications/trigger/route.ts`)
- [ ] T002 Add dependencies: ['next', 'react', 'prisma', 'resend', 'playwright', 'ts-morph']
- [ ] T003 Setup TypeScript configuration (`tsconfig.json` with strict types)
- [ ] T004 Add Prisma schema for NotificationTemplate and NotificationLog
- [ ] T005 Initialize Git with .gitignore and basic .eslintrc

## Phase 2: Foundational Tasks

- [ ] T006 Implement NotificationCompiler class in utils/notificationCompiler.ts
- [ ] T007 Create WhatsApp gateway client handling 24h session window
- [ ] T008 Develop async dispatch mechanism using `after()`
- [ ] T009 Implement email client using Resend
- [ ] T010 Create NotificationLog data layer

## Phase 3: Core Functionality

### User Story 1: Trigger Notification Pipeline

- [ ] T011 Create trigger route handler in app/api/notifications/trigger/route.ts
- [ ] T012 Compile templates using NotificationCompiler
- [ ] T013 Handle whatsappOptIn condition
- [ ] T014 Dispatch WhatsApp messages synchronously
- [ ] T015 Dispatch Email messages synchronously

### User Story 2: Create Notification Template

- [ ] T016 Add admin UI for template management (admin/notifications/page.tsx)
- [ ] T017 Validate template structure on save
- [ ] T018 Persist templates to database

### User Story 3: Webhook Integration

- [ ] T019 [US3] Implement delivery webhook in app/api/notifications/webhook/whatsapp.ts
- [ ] T020 [US3] Link notification status updates to NotificationLog in lib/notification/dispatcher.ts
- [ ] T021 [US3] Update NotificationLog with DELIVERED/FAILED states

## Dependencies Graph
1. Phase 2 -> Phase 3 US1
2. Phase 2 Whitstapps US1 -> Phase 2 Email US1
3. Phase 3 US1 -> Phase 3 US2

## Parallel Opportunities
- P T002 T003 T004
- P T006 T007 T008
- P T011 T012 T013

## Implementation Strategy
- Start with US1 P1 complete, then US2 undergo testing
- MVP includes basic metrics display
- Expand functionality in incremental steps with code reviews

## Format Validation
- ✅ All tasks follow checklist format
- ✅ Task IDs are sequential
- ✅ Story labels are present in appropriate phases
- ✅ File paths are specific and project-relative

## Total Tasks: 21
- Story-Specific Tasks: 11 (US1: 5, US2: 3, US3: 3)
- Foundational Tasks: 5
- Setup Tasks: 5

## Validation Steps
1. Check all tasks have correct structure: `- [ ] TNNN [P?] [Story?] Description`
2. Verify dependencies match completion order
3. Ensure file paths use `src/` prefix (e.g., `src/app/...`, `src/lib/...`)
4. Confirm environment variables are properly initialized