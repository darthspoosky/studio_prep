
# 🚀 PrepTalk CI/CD Pipeline Documentation

This repository includes a comprehensive CI/CD pipeline with multiple GitHub Actions workflows for automated testing, security scanning, performance monitoring, and deployment.

## 📋 **Workflow Overview**

### **1. Main CI/CD Pipeline** (`ci.yml`)
**Triggers**: Push to master/develop, Pull requests, Manual dispatch

**Jobs**:
- **Code Quality & Security**: ESLint, TypeScript checking, security audit, secret detection
- **Testing**: Unit tests, integration tests, admin functionality tests
- **Build & Validate**: Next.js build, Firebase Functions build
- **Security & Performance Analysis**: Bundle analysis, Lighthouse CI
- **Deployment Preparation**: Firebase deployment package creation
- **Status Summary**: Overall pipeline status reporting

### **2. Production Deployment** (`deploy.yml`)
**Triggers**: Successful CI pipeline completion, Manual dispatch

**Features**:
- Automated deployment to Firebase Hosting and Functions
- Firestore rules deployment
- Post-deployment verification and smoke tests
- Environment-specific deployments (production/staging)

### **3. Security Scanning** (`security.yml`)
**Triggers**: Weekly schedule, Push to master, Pull requests, Manual dispatch

**Scans**:
- Dependency security check with npm audit and Snyk
- Code security analysis with CodeQL
- Secret detection with TruffleHog
- Docker security scanning with Trivy
- Comprehensive security reporting

### **4. Performance Monitoring** (`performance.yml`)
**Triggers**: Daily schedule, Manual dispatch

**Monitoring**:
- Lighthouse performance audits for all major pages
- Bundle size analysis and tracking
- Performance reporting and recommendations

---

## ⚙️ **Setup Instructions**

### **1. Repository Secrets Configuration**

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```
FIREBASE_TOKEN=<your-firebase-ci-token>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
SNYK_TOKEN=<your-snyk-api-token>
```

### **2. Firebase CI Token Setup**

Generate a Firebase CI token:
```bash
firebase login:ci
```

Add the generated token to GitHub Secrets as `FIREBASE_TOKEN`.

### **3. Environment Setup**

Create environment protection rules:
1. Go to `Settings > Environments`
2. Create `production` and `staging` environments
3. Add protection rules as needed (required reviewers, deployment branches)

### **4. Branch Protection Rules**

Configure branch protection for `master`:
1. Go to `Settings > Branches`
2. Add rule for `master` branch
3. Enable:
   - Require a pull request before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators

---

## 🔧 **Workflow Configuration Details**

### **CI Pipeline Jobs**

#### **Code Quality & Security**
```yaml
- ESLint linting with Next.js configuration
- TypeScript type checking
- npm audit for dependency vulnerabilities
- TruffleHog secret detection
```

#### **Testing Matrix**
```yaml
strategy:
  matrix:
    test-group: [unit, integration, admin]
```

- **Unit Tests**: Jest with coverage reporting
- **Integration Tests**: Full application testing
- **Admin Tests**: PDF processing, OCR, AI functionality

#### **Build Validation**
```yaml
- Next.js production build
- Firebase Functions TypeScript compilation
- Build artifact upload for deployment
```

### **Security Scanning Configuration**

#### **Dependency Scanning**
- **npm audit**: Checks for known vulnerabilities
- **Snyk**: Advanced vulnerability database
- **Automatic SARIF upload**: Results to GitHub Security tab

#### **Code Analysis**
- **CodeQL**: GitHub's semantic code analysis
- **TruffleHog**: Git history secret scanning
- **Docker security**: Trivy container scanning

### **Performance Monitoring**

#### **Lighthouse Configuration**
```yaml
Pages Tested:
- Homepage
- Dashboard
- Daily Quiz
- Writing Practice
- Mock Interview
- Newspaper Analysis
```

#### **Bundle Analysis**
- Automated bundle size tracking
- Performance regression detection
- Size limit warnings

---

## 📊 **Monitoring and Alerts**

### **Build Status Monitoring**

The pipeline creates status badges and reports:
- Build status badges in CI artifacts
- Comprehensive status summaries
- Failed build notifications

### **Performance Tracking**

Daily performance monitoring includes:
- Core Web Vitals tracking
- Bundle size trending
- Page load time monitoring
- Performance recommendations

### **Security Alerts**

Automated security monitoring:
- Weekly dependency scans
- Real-time secret detection
- Code vulnerability analysis
- Security report generation

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Firebase Deployment Failures**
```bash
# Check Firebase token validity
firebase projects:list --token $FIREBASE_TOKEN

# Verify project permissions
firebase use --add <project-id>
```

#### **Test Failures**
```bash
# Run tests locally
npm test
npm run typecheck
npm run lint

# Run admin tests
node test_admin_functionality.mjs
```

#### **Build Issues**
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check TypeScript errors
npm run typecheck
```

### **Debug Mode**

Enable workflow debugging by setting repository secrets:
```
ACTIONS_STEP_DEBUG=true
ACTIONS_RUNNER_DEBUG=true
```

---

## 🔄 **Workflow Triggers**

### **Automatic Triggers**

| Workflow | Trigger | Frequency |
|----------|---------|-----------|
| CI/CD | Push to master/develop | On every commit |
| CI/CD | Pull Request | On PR creation/update |
| Security | Schedule | Weekly (Monday 2 AM UTC) |
| Performance | Schedule | Daily (6 AM UTC) |
| Deploy | CI Success | After successful CI on master |

### **Manual Triggers**

All workflows support manual dispatch through GitHub UI:
1. Go to `Actions` tab
2. Select workflow
3. Click `Run workflow`
4. Choose branch and parameters

---

## 📈 **Performance Metrics**

### **CI Pipeline Performance**

Typical execution times:
- Code Quality: ~2-3 minutes
- Testing: ~5-8 minutes (parallel matrix)
- Build: ~3-5 minutes
- Total: ~10-15 minutes

### **Optimization Strategies**

- **Parallel job execution**: Matrix strategy for tests
- **Dependency caching**: npm cache between runs
- **Artifact sharing**: Build output reuse across jobs
- **Conditional execution**: Skip unnecessary steps

---

## 🛡️ **Security Best Practices**

### **Secret Management**
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly
- Limit secret access to necessary workflows

### **Dependency Security**
- Regular dependency updates
- Automated vulnerability scanning
- Security patch notifications

### **Code Security**
- Static code analysis with CodeQL
- Secret detection in commits
- Container security scanning

---

## 📱 **Notification Setup**

### **GitHub Notifications**

Configure notifications for:
- Failed workflow runs
- Security vulnerabilities
- Performance regressions
- Deployment completions

### **External Integrations**

Consider integrating with:
- Slack for team notifications
- Email alerts for critical failures
- Dashboard tools for metrics visualization

---

## 🔧 **Customization**

### **Adding New Workflows**

1. Create new `.yml` file in `.github/workflows/`
2. Define triggers and jobs
3. Add any required secrets
4. Test with manual dispatch

### **Modifying Existing Workflows**

1. Update workflow files
2. Test changes in feature branch
3. Monitor execution in Actions tab
4. Update documentation as needed

### **Environment-Specific Configuration**

Use environment variables and secrets for:
- Different Firebase projects
- Staging vs production URLs
- Environment-specific API keys

---

## 📋 **Checklist for New Contributors**

- [ ] Understand workflow structure
- [ ] Set up local development environment
- [ ] Run tests locally before pushing
- [ ] Follow branch protection rules
- [ ] Monitor CI pipeline status
- [ ] Review security scan results

---

## 📚 **Additional Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides)

---

**Last Updated**: $(date)
**Pipeline Version**: 1.0.0
**Maintained by**: PrepTalk Development Team
