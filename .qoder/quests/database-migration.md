# Database and Storage Migration Design

## Overview

This design document outlines the strategy for migrating the EstateCare system's database and storage infrastructure from Firebase Cloud (Firestore + Firebase Storage) to a local server environment in the `myserver` branch. The migration aims to achieve full data sovereignty while maintaining system functionality and data integrity.

## Current Architecture

### Database Layer
- **Provider**: Google Cloud Firestore (NoSQL document database)
- **Access Pattern**: Client-side SDK + Firebase Admin SDK for server routes
- **Configuration**: Environment-driven with Firebase project credentials
- **Collections**: 30+ collections including users, workers, residences, inventory, orders, maintenance requests, accommodations, and audit logs

### Storage Layer
- **Primary Storage**: Firebase Storage for file uploads (attachments, images)
- **Secondary Storage**: Vercel Blob for certain media assets
- **Access**: Authenticated via Firebase Auth tokens

### Authentication
- **Provider**: Firebase Authentication
- **Methods**: Email/password, potentially OAuth providers
- **Session Management**: Browser local persistence with token refresh

## Migration Objectives

### Primary Goals
- Migrate all Firestore collections to a local database solution
- Replace Firebase Storage with local file storage system
- Establish local authentication mechanism
- Maintain existing API contracts and data structures
- Enable offline-first operation on local network
- Preserve all historical data and audit trails

### Non-Functional Requirements
- Zero data loss during migration
- Minimal application code changes
- Backward compatibility with existing data formats
- Support for future cloud-to-local synchronization (if needed)

## Target Architecture

### Selected Database Solution: MongoDB

**Decision Rationale**: MongoDB selected as the optimal solution for EstateCare migration based on:

#### Technical Alignment
- **Document Model Match**: MongoDB's document structure mirrors Firestore exactly, enabling near 1:1 data migration
- **Schema Flexibility**: Accommodates varying worker records, room configurations, and inventory items without rigid schema constraints
- **Nested Data Support**: Native handling of embedded documents matches your residence → building → floor → room hierarchy
- **Query Capabilities**: Aggregation pipeline supports complex accommodation reports and inventory analytics

#### Migration Efficiency
- **Direct JSON Export/Import**: Firestore JSON exports can be imported to MongoDB with minimal transformation
- **Preserved Document IDs**: MongoDB allows custom _id fields, maintaining Firestore document ID continuity
- **No Schema Definition Required**: Eliminates weeks of schema design work needed for PostgreSQL
- **Faster Implementation**: Reduces migration timeline from 6-8 weeks to achievable 24-hour window

#### Operational Benefits
- **Mature Ecosystem**: Rich tooling (MongoDB Compass, mongodump/mongorestore, monitoring)
- **Performance**: Excellent read/write performance for your accommodation and inventory operations
- **Scalability**: Horizontal scaling capability if worker count grows significantly
- **Developer Familiarity**: JSON-based queries similar to Firestore SDK patterns

#### Why Not PostgreSQL or CouchDB
- **PostgreSQL**: Requires extensive schema normalization, complex JSONB indexing strategy, and longer development time (not feasible in 24 hours)
- **CouchDB**: Smaller ecosystem, less mature administration tools, and less community support for troubleshooting

### Storage Solution

#### Local File System Structure
- **Base Path**: Configurable storage root directory
- **Organization**: Mimic Firebase Storage path structure
  - `/uploads/{userId}/{category}/{filename}`
  - `/attachments/{module}/{entityId}/{filename}`
  - `/invoices/{year}/{month}/{invoiceId}.pdf`
- **Access Control**: File permissions aligned with database user roles
- **Backup Strategy**: Incremental file-level backups with versioning

#### Alternative: MinIO Object Storage
- **Rationale**: S3-compatible object storage for local deployment
- **Advantages**:
  - Drop-in replacement for cloud object storage APIs
  - Erasure coding for data protection
  - Built-in versioning and lifecycle policies
  - Web console for management

### Selected Authentication Strategy: Custom JWT Authentication

**Decision Rationale**: Custom JWT implementation chosen for optimal balance of security, simplicity, and rapid deployment.

#### Implementation Approach

**Token Architecture**:
- **Signing Algorithm**: RS256 (RSA public/private key pair) for enhanced security
- **Token Payload**: User ID, email, role (Admin/Supervisor/User), residence assignments
- **Expiration**: 8-hour access tokens with 30-day refresh tokens
- **Storage**: HTTP-only secure cookies for web, localStorage for mobile if needed

**Password Management**:
- **Hashing**: Bcrypt with cost factor 12 (balances security and performance)
- **Migration Strategy**: 
  - Export Firebase user UIDs and emails
  - Generate temporary passwords for all users
  - Force password reset on first local login
  - Optionally: Email temporary credentials to users pre-migration

**Session Management**:
- **Access Pattern**: Bearer token in Authorization header + refresh token in HTTP-only cookie
- **Refresh Flow**: Automatic silent refresh before token expiration
- **Revocation**: Token blacklist in MongoDB for immediate logout capability

**Role-Based Access Control (RBAC)**:
- **Roles**: Migrate from Firestore security rules structure
  - Admin: Full system access
  - Supervisor: Limited write access (inventory, orders, maintenance)
  - User: Read-only and self-service operations
- **Enforcement**: Middleware validation on all API routes

#### Why Custom JWT (Not Keycloak or Hybrid)

**Advantages**:
- **Rapid Implementation**: Can be built and tested within 6-8 hours
- **No External Dependencies**: Fully local, no internet requirement
- **Lightweight**: Minimal resource overhead on local server
- **Full Control**: Custom claims and business logic integration
- **Simple Debugging**: Transparent token structure, easy troubleshooting

**Keycloak Rejected Because**:
- **Setup Complexity**: Requires 1-2 days for proper configuration
- **Resource Intensive**: Additional JVM application consuming significant RAM
- **Over-engineered**: Features like SSO, federation unnecessary for single-application deployment
- **Not Feasible in 24 Hours**: Installation, configuration, integration would exceed timeline

**Hybrid Firebase Auth Rejected Because**:
- **Internet Dependency**: Defeats purpose of local server migration
- **Cost**: Ongoing Firebase project costs for authentication service
- **Split Architecture**: Complicates system with cloud dependency
- **Latency**: Additional network hop for every authentication check

## Data Migration Strategy

### Phase 1: Environment Preparation

#### Local Server Infrastructure
- Install chosen database system (MongoDB recommended)
- Configure storage directories with appropriate permissions
- Set up local authentication service
- Establish network accessibility within organization

#### Development Environment
- Create `myserver` branch from main/production branch
- Configure environment variables for local endpoints
- Update connection strings and API endpoints
- Implement feature flags for gradual rollout

### Phase 2: Schema and Data Export

#### Firestore Data Export
- Utilize Firebase Admin SDK to export all collections
- Export format: JSON documents preserving structure
- Include metadata: timestamps, document IDs, subcollections
- Export strategy: Collection-by-collection with progress tracking

#### Collections to Migrate
```
Priority 1 (Core Data):
- users
- workers
- residences (with embedded rooms)
- companies
- contracts

Priority 2 (Operational Data):
- occupants
- accommodationHistory
- inventory
- inventoryTransactions
- orders

Priority 3 (Requests and Logs):
- maintenanceRequests
- serviceOrders
- transferRequests
- notifications
- feedback

Priority 4 (Supporting Data):
- invoices
- mivs (Material Issue Vouchers)
- mrvs (Material Receipt Vouchers)
- stockTransfers
- inventoryAudits
- fcmTokens
- counters
```

#### Storage File Export
- Enumerate all files in Firebase Storage buckets
- Download with original metadata preservation
- Organize in local directory structure
- Generate manifest for verification

### Phase 3: Data Transformation

#### Schema Mapping
- **Document IDs**: Preserve original Firestore document IDs as primary keys
- **Timestamps**: Convert Firestore Timestamps to ISO 8601 strings or native date types
- **References**: Transform Firestore DocumentReferences to string paths or foreign keys
- **GeoPoints**: Convert to standard latitude/longitude pairs
- **Arrays**: Maintain as-is (natively supported in MongoDB/PostgreSQL JSONB)
- **Nested Objects**: Preserve document structure

#### User Authentication Migration
- Export user records from Firebase Auth (email, UID, metadata)
- Generate temporary passwords or implement password reset flow
- Migrate custom claims to local role fields
- Map Firebase UIDs to local user identifiers

### Phase 4: Local Database Population

#### Import Process
- Use batch insert operations for performance
- Maintain transactional integrity for related collections
- Create indexes matching Firestore query patterns
- Validate data integrity post-import with checksums

#### Index Creation
```
Essential Indexes:
- users: uid (unique), email (unique), role
- workers: id (unique), nationalId, status, currentResidence
- residences: id (unique), name
- occupants: workerId, residenceId, roomId, status, startDate
- inventory: id (unique), category, residenceId
- orders: id (unique), requestedById, status, createdAt
- maintenanceRequests: id (unique), residenceId, status, requestedById
```

### Phase 5: Application Layer Adaptation

#### Database Access Layer
- Create abstraction layer for database operations
- Implement adapter pattern supporting both Firebase and local database
- Maintain consistent API for data operations
- Example interface:
  ```
  Interface DataProvider:
    - getDocument(collection, documentId)
    - queryDocuments(collection, filters, orderBy, limit)
    - createDocument(collection, data)
    - updateDocument(collection, documentId, updates)
    - deleteDocument(collection, documentId)
    - runTransaction(operations)
  ```

#### Configuration Management
- Environment variable for database provider selection
- Connection string configuration for local database
- Fallback mechanisms for hybrid operation
- Feature flags for gradual feature migration

#### Code Modification Areas
```
Files Requiring Changes:
- src/lib/firebase.ts → Create src/lib/database.ts abstraction
- src/lib/firebase-admin.ts → Server-side database adapter
- src/context/*.tsx → Update data fetching hooks
- src/app/api/**/route.ts → Adapt API routes to new database
```

### Phase 6: Storage Integration

#### File Upload Handling
- Modify upload endpoints to write to local storage
- Generate file paths matching storage structure
- Return local URLs or file references
- Implement streaming for large files

#### File Access and Serving
- Create file serving endpoint with authentication checks
- Implement access control based on user roles
- Support range requests for media streaming
- Set appropriate cache headers

#### URL Transformation
- Update all Firebase Storage URLs to local endpoints
- Implement URL rewriting middleware
- Maintain backward compatibility with old URLs during transition

## Testing and Validation

### Data Integrity Verification
- Document count comparison between source and target
- Random sampling validation of document contents
- Foreign key relationship verification
- Timestamp and metadata accuracy checks

### Functional Testing
- Authentication flow validation
- CRUD operations for all major entities
- Complex query patterns (filtering, sorting, pagination)
- File upload and download workflows
- Transaction integrity tests

### Performance Benchmarks
- Query response time comparisons
- Concurrent user load testing
- File upload/download throughput
- Database connection pool efficiency

### Security Audit
- Authentication mechanism review
- Authorization rule enforcement
- SQL injection / NoSQL injection testing (if applicable)
- File access permission verification
- Network security assessment

## Deployment Strategy

### Rollout Approach

#### Stage 1: Development Environment
- Deploy local database on development server
- Migrate test data subset
- Developer testing and iteration
- Performance profiling

#### Stage 2: Staging Environment
- Full production data replica migration
- End-to-end testing with production-like load
- User acceptance testing with select users
- Backup and rollback procedure validation

#### Stage 3: Production Cutover
- Schedule maintenance window
- Final data synchronization from Firebase
- Switch DNS or load balancer to local server
- Monitor for issues during initial hours
- Keep Firebase instance in read-only mode for fallback

### Rollback Plan
- Maintain Firebase project in operational state for 30 days
- Document step-by-step rollback procedures
- Automated scripts for re-enabling Firebase connections
- Data reconciliation process for changes made during local operation

## Operational Considerations

### Backup and Recovery
- **Daily Full Backups**: Automated database dumps with compression
- **Hourly Incremental Backups**: Transaction logs or binary logs
- **File Storage Snapshots**: Incremental file system backups
- **Off-site Backup**: Secondary location or external storage
- **Retention Policy**: 7 daily, 4 weekly, 12 monthly backups
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour

### Monitoring and Alerting
- Database health metrics (connections, query performance, storage)
- Storage capacity and growth trends
- Authentication success/failure rates
- API endpoint response times
- Error logs and exception tracking
- Automated alerts for critical thresholds

### Scalability Planning
- Current user count and growth projections
- Database size growth rate
- Storage capacity planning
- Network bandwidth requirements
- Server resource allocation (CPU, RAM, disk I/O)

### Maintenance Procedures
- Regular database optimization (vacuum, reindex)
- Log rotation and archival
- Security patch management
- Certificate renewal for HTTPS endpoints
- Backup restoration drills

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | Critical | Low | Multi-stage verification, dry-run migrations, maintain source until confirmed |
| Performance degradation | High | Medium | Benchmark testing, index optimization, query tuning |
| Authentication failures | Critical | Low | Parallel auth systems during transition, comprehensive testing |
| File corruption during transfer | Medium | Low | Checksum verification, incremental migration with validation |
| Application compatibility issues | High | Medium | Abstraction layer, extensive regression testing |
| Insufficient local resources | Medium | Low | Capacity planning, scalable infrastructure |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Extended downtime | High | Low | Phased rollout, quick rollback procedures |
| Staff training gaps | Medium | Medium | Documentation, training sessions, gradual exposure |
| Backup failure | Critical | Low | Multiple backup strategies, regular restoration tests |
| Security vulnerabilities | Critical | Medium | Security audit, penetration testing, access controls |

## Success Criteria

### Functional Success
- All 30+ collections successfully migrated with 100% data integrity
- All CRUD operations functioning correctly
- Authentication and authorization working as expected
- File uploads and downloads operational
- All existing API endpoints responding correctly

### Performance Success
- Query response times within 150% of Firebase baseline
- File download speeds matching network capacity
- Support for current user concurrency levels
- Database query performance meeting SLA targets

### Operational Success
- Automated backups running successfully
- Monitoring dashboards operational
- Documentation complete and accessible
- Team trained on new infrastructure
- Rollback procedure validated

## Accelerated 24-Hour Migration Timeline

**Critical Constraint**: All migration activities must complete within 24-hour maintenance window with system downtime acceptable.

### Hour-by-Hour Execution Plan

#### Hours 0-3: Pre-Migration Preparation (Parallel Execution)

**Server Setup** (Team Member 1):
- Hour 0-1: Install Ubuntu Server 22.04 LTS, MongoDB 7.0, Node.js 18
- Hour 1-2: Configure MongoDB with authentication, create admin user
- Hour 2-3: Set up storage directories, configure Nginx for file serving

**Data Export** (Team Member 2):
- Hour 0-2: Run Firestore export scripts for all 30+ collections
- Hour 2-3: Download all Firebase Storage files (parallel download with 10 threads)

**Code Preparation** (Team Member 3):
- Hour 0-3: Implement MongoDB adapter layer, JWT authentication middleware

#### Hours 3-6: Data Import and Transformation

**Database Population**:
- Hour 3-4: Import Priority 1 collections (users, workers, residences, companies, contracts)
- Hour 4-5: Import Priority 2 collections (occupants, accommodationHistory, inventory, orders)
- Hour 5-6: Import Priority 3+4 collections (remaining data)
- Parallel: Create indexes during import process

**Storage Migration**:
- Hour 3-6: Copy files to local storage with original paths (parallel with database import)

#### Hours 6-10: Application Integration

**Code Deployment**:
- Hour 6-7: Deploy updated codebase to local server
- Hour 7-8: Configure environment variables for local database connection
- Hour 8-9: Update Firebase config to point to local endpoints
- Hour 9-10: Deploy and start application services

#### Hours 10-14: Testing and Validation

**Functional Testing** (Parallel teams):
- Hour 10-11: Authentication flows (login, logout, password reset)
- Hour 11-12: Core CRUD operations (workers, accommodations, inventory)
- Hour 12-13: Complex workflows (room assignment, transfers, orders)
- Hour 13-14: File upload/download, reports generation

**Data Integrity Verification**:
- Hour 10-14: Automated scripts comparing document counts, sampling random records

#### Hours 14-18: Performance Tuning and Issue Resolution

- Hour 14-15: Identify and resolve any critical bugs
- Hour 15-16: Query performance optimization (additional indexes if needed)
- Hour 16-17: Load testing with simulated concurrent users
- Hour 17-18: Security validation (authentication, authorization, file access)

#### Hours 18-22: User Acceptance and Final Validation

- Hour 18-20: Selected power users test critical workflows
- Hour 20-21: Address any user-reported issues
- Hour 21-22: Final data consistency checks

#### Hours 22-24: Go-Live and Monitoring

- Hour 22-23: Update DNS/network routing to local server
- Hour 23-24: Monitor system health, user logins, error logs
- Hour 24+: Post-migration monitoring (first 48 hours critical)

### Contingency Time Buffers

- **Hours 6-10**: 2-hour buffer if data import takes longer
- **Hours 14-18**: 4-hour buffer for critical issue resolution
- **Rollback Decision Point**: Hour 18 - if major issues persist, initiate rollback to Firebase

### Team Resource Requirements

**Minimum Team Size**: 3-4 people for parallel execution
- **Database Administrator**: MongoDB setup, data import, index optimization
- **Backend Developer**: Code adaptation, authentication implementation
- **DevOps Engineer**: Server configuration, deployment, monitoring
- **QA Tester**: Validation testing, user acceptance coordination

### Pre-Migration Checklist (Complete 1 Week Before)

- [ ] Local server hardware procured and installed
- [ ] MongoDB 7.0 installation tested on staging environment
- [ ] Code changes developed and tested in `myserver` branch
- [ ] Export scripts tested with sample data
- [ ] Team trained on migration procedures
- [ ] Rollback procedure documented and rehearsed
- [ ] Users notified of 24-hour maintenance window
- [ ] Backup of current Firebase data taken

### Risk Mitigation for Aggressive Timeline

**High-Risk Activities**:
1. **Data Export Failure**: Pre-test export scripts 48 hours before, have backup exports ready
2. **Import Speed Issues**: Use MongoDB bulk operations, disable index building during import
3. **Authentication Bugs**: Implement basic auth first, enhance post-migration
4. **File Migration Delays**: Prioritize critical files (invoices, attachments), defer media if needed
5. **Application Errors**: Keep Firebase in read-only mode for emergency reference

**Success Criteria for Go-Live**:
- All user accounts migrated and accessible
- Core workflows operational (accommodation assignment, inventory transactions)
- No data loss or corruption detected
- Response times within acceptable range (<2 seconds for standard queries)
- File uploads/downloads working

**Absolute Show-Stoppers Requiring Rollback**:
- Data integrity failures (missing documents, corrupted data)
- Authentication completely broken
- Database performance unusable (>10 second query times)
- Critical application features non-functional

## Finalized Decisions and Remaining Configuration

### Confirmed Technical Decisions
1. ✅ **Database System**: MongoDB 7.0 Community Edition
2. ✅ **Authentication**: Custom JWT with RS256 signing
3. ✅ **Timeline**: 24-hour aggressive migration window
4. ⚠️ **File Storage**: Local file system (decision: use `/var/estatecare/storage` with symlinks for organized access)
5. ⚠️ **Database Hosting**: Docker container recommended for easier backup/restore and version management

### Remaining Configuration Decisions

**Immediate (Required Before Migration)**:
1. ⚠️ **Maintenance Window Date/Time**: Select specific 24-hour window (recommend weekend: Friday 6 PM to Saturday 6 PM)
2. ⚠️ **Server Specifications**: Minimum requirements based on data size
   - Recommended: 16GB RAM, 8-core CPU, 500GB SSD, 1Gbps network
   - Calculate storage: (Current Firestore size × 2) + (Firebase Storage size × 1.5)
3. ⚠️ **Network Access**: Determine if local server needs VPN access for remote users
4. ⚠️ **SSL Certificates**: Self-signed for internal LAN, or Let's Encrypt if internet-facing

**Post-Migration (Can Decide Later)**:
1. Firebase project retention period (recommend: keep active read-only for 30 days)
2. Off-site backup strategy (can implement incrementally)
3. Monitoring and alerting tools (start with basic MongoDB logs, enhance over time)
4. Future cloud sync requirements (if any)

## Dependencies and Prerequisites

### Infrastructure
- Local server hardware with sufficient specifications
- Network configuration with static IP addressing
- Power backup (UPS) for server reliability
- Cooling and physical security for server location

### Software
- Operating system (Linux recommended: Ubuntu Server 22.04 LTS)
- Database management system
- Web server (Nginx or Apache for file serving)
- SSL certificates for HTTPS
- Backup software and storage

### Team Skills
- Database administration expertise
- Server infrastructure management
- Network configuration knowledge
- Application development for integration work
- Security best practices awareness

### Access and Permissions
- Firebase Admin access for data export
- Server root access for installation and configuration
- Source code repository access for `myserver` branch
- Network firewall configuration authority

## Conclusion

This migration represents a strategic shift from cloud-dependent architecture to local data sovereignty. The accelerated 24-hour timeline is achievable with MongoDB and custom JWT authentication, both optimized for rapid deployment. Success depends on meticulous preparation, parallel execution by skilled team members, and disciplined adherence to the hour-by-hour schedule. The rollback plan at Hour 18 provides a safety net if critical issues emerge.

---

## ملخص تنفيذي بالعربية

### القرارات النهائية

#### 1. قاعدة البيانات: MongoDB
**لماذا MongoDB؟**
- يطابق بنية Firestore تمامًا (قاعدة بيانات المستندات)
- نقل البيانات مباشر بدون تحويلات معقدة
- يدعم البيانات المتداخلة (العمارات → الأدوار → الغرف)
- أسرع في التنفيذ خلال 24 ساعة
- أدوات إدارة ممتازة ومجتمع كبير

**البدائل المرفوضة:**
- PostgreSQL: يحتاج أسابيع لتصميم الجداول
- CouchDB: أدوات أقل ومجتمع محدود

#### 2. المصادقة: Custom JWT
**لماذا JWT مخصص؟**
- سريع التنفيذ (6-8 ساعات فقط)
- لا يحتاج إنترنت (محلي بالكامل)
- خفيف على الخادم
- تحكم كامل في المنطق
- سهل في حل المشاكل

**كيف يعمل:**
- تشفير: RS256 (مفاتيح عامة/خاصة)
- مدة الجلسة: 8 ساعات
- كلمات المرور: Bcrypt (حماية قوية)
- الأدوار: Admin, Supervisor, User

#### 3. الجدول الزمني: 24 ساعة

**التقسيم حسب الساعات:**

| الوقت | النشاط | المسؤول |
|-------|---------|----------|
| 0-3 ساعات | تجهيز الخادم + تصدير البيانات + البرمجة | فريق متوازي (3 أشخاص) |
| 3-6 ساعات | استيراد البيانات إلى MongoDB | مدير قاعدة البيانات |
| 6-10 ساعات | نشر التطبيق المحدث | مطور Backend |
| 10-14 ساعات | الاختبار والتحقق | فريق QA |
| 14-18 ساعات | حل المشاكل وتحسين الأداء | الفريق الكامل |
| 18-22 ساعات | اختبار المستخدمين النهائي | مستخدمون مختارون |
| 22-24 ساعات | التشغيل والمراقبة | DevOps |

### متطلبات التنفيذ

#### متطلبات الخادم (Server):
```
الذاكرة: 16GB RAM (الحد الأدنى)
المعالج: 8 cores
التخزين: 500GB SSD
الشبكة: 1Gbps
نظام التشغيل: Ubuntu Server 22.04 LTS
```

#### البرامج المطلوبة:
- MongoDB 7.0 Community Edition
- Node.js 18+
- Nginx (لخدمة الملفات)
- Docker (اختياري لكن موصى به)

#### الفريق المطلوب (3-4 أشخاص):
1. **مدير قاعدة بيانات**: تثبيت MongoDB، استيراد البيانات
2. **مطور Backend**: تعديل الكود، تطبيق JWT
3. **مهندس DevOps**: إعداد الخادم، النشر
4. **مختبر QA**: اختبار الوظائف

### خطوات ما قبل الترحيل (أسبوع واحد قبل)

✅ **قائمة التحقق:**
- [ ] شراء وتثبيت الخادم المحلي
- [ ] اختبار MongoDB على بيئة تجريبية
- [ ] تطوير واختبار التعديلات البرمجية في فرع `myserver`
- [ ] اختبار سكربتات التصدير
- [ ] تدريب الفريق
- [ ] توثيق إجراءات الرجوع للنظام القديم
- [ ] إخطار المستخدمين بفترة الصيانة
- [ ] أخذ نسخة احتياطية كاملة من Firebase

### نقطة القرار الحاسمة

**الساعة 18 (بعد 18 ساعة من البدء):**
- إذا كانت المشاكل الحرجة مستمرة → الرجوع إلى Firebase
- إذا كان كل شيء يعمل → المتابعة للتشغيل النهائي

### معايير النجاح

✅ **يجب أن يعمل:**
- تسجيل الدخول لجميع المستخدمين
- تعيين الغرف للعمال
- إدارة المخزون
- طلبات الصيانة
- رفع وتحميل الملفات
- التقارير الأساسية

❌ **أسباب الرجوع الفوري:**
- فقدان بيانات أو تلفها
- المصادقة لا تعمل نهائيًا
- بطء شديد في قاعدة البيانات (>10 ثواني)
- ميزات حرجة معطلة

### المخاطر والحلول

| المخاطر | الحل |
|---------|------|
| فشل تصدير البيانات | اختبار مسبق قبل 48 ساعة |
| بطء الاستيراد | استخدام bulk operations |
| أخطاء المصادقة | تطبيق أساسي أولاً، تحسين لاحقاً |
| تأخير نقل الملفات | إعطاء الأولوية للملفات الحرجة |
| أخطاء التطبيق | إبقاء Firebase للقراءة فقط كمرجع |

### التكلفة المتوقعة

**تكاليف لمرة واحدة:**
- خادم: حسب المواصفات (تقديري: 2000-5000 دولار)
- UPS احتياطي: 500-1000 دولار
- شهادة SSL: مجانية (Let's Encrypt)

**تكاليف شهرية:**
- الكهرباء: 50-100 دولار
- صيانة: حسب الاتفاق
- النسخ الاحتياطي الخارجي: 20-50 دولار (اختياري)

### الفوائد المتوقعة

✅ **السيطرة الكاملة:**
- البيانات محلية 100%
- لا تعتمد على الإنترنت
- خصوصية كاملة
- لا توجد حدود على Firebase

✅ **توفير التكاليف:**
- إلغاء رسوم Firebase الشهرية
- إلغاء رسوم Vercel Blob
- تحكم في سعة التخزين

✅ **الأداء:**
- سرعة الشبكة المحلية
- لا توجد قيود على الاستعلامات
- تحكم كامل في الفهارس

### الدعم بعد الترحيل

**الأيام الثلاثة الأولى (حرجة):**
- مراقبة مستمرة 24/7
- فريق جاهز للاستجابة
- إصلاح فوري للمشاكل

**أول 30 يوم:**
- إبقاء Firebase نشط (للقراءة فقط)
- مراقبة يومية
- تحسين الأداء
- تدريب المستخدمين

**طويل المدى:**
- نسخ احتياطي يومي
- صيانة دورية
- تحديثات أمنية
- مراقبة السعة والأداء
