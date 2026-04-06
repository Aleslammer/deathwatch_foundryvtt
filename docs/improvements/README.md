# Code Improvements Documentation

This directory contains detailed improvement recommendations for the Deathwatch Foundry VTT system codebase.

**Assessment Date**: 2026-04-05  
**Codebase**: `claude` branch  
**Status**: Planning Phase

---

## 📋 Documents

| Document | Priority | Issues | Effort | Status |
|----------|----------|--------|--------|--------|
| [00-overview.md](00-overview.md) | N/A | Summary | N/A | ✅ Complete |
| [01-critical-issues.md](01-critical-issues.md) | 🔴 Critical | 3 | 1 week | 📝 Planning |
| [02-high-priority.md](02-high-priority.md) | 🟡 High | 4 | 2-3 weeks | 📝 Planning |
| [03-medium-priority.md](03-medium-priority.md) | 🟢 Medium | 6 | 3-4 weeks | 📝 Planning |
| [04-low-priority.md](04-low-priority.md) | 🔵 Low | 4 | 1-2 weeks | 📝 Planning |
| [05-quick-wins.md](05-quick-wins.md) | ⚡ Quick Wins | 5 | 2-3 hours | 📝 Planning |

**Total Issues**: 22  
**Total Estimated Effort**: 7-11 weeks (can be parallelized)

---

## 🎯 Quick Reference

### Critical Issues (Must Fix)
1. **Missing Error Handling** - Unhandled promise rejections throughout codebase
2. **HTML Injection Risk** - Potential XSS vulnerability in chat messages
3. **Large Initialization File** - deathwatch.mjs is 1044 lines, needs modularization

### High Priority (Important)
4. **Sheet Classes Too Large** - actor-sheet.mjs (1160 lines) and actor-sheet-v2.mjs (947 lines)
5. **Performance - Map→Array Conversions** - Repeated conversions in modifier collection
6. **Async/Await Consistency** - Mixed promise patterns (.then vs async/await)
7. **Missing JSDoc** - Public APIs lack type annotations and documentation

### Medium Priority (Should Have)
8. **Magic Numbers** - Hard-coded values without explanation
9. **Commented-Out Code** - Dead code in handlebars.js
10. **Long Functions** - Functions exceeding 100 lines
11. **Code Duplication Between Sheets** - v1 and v2 share 60% logic
12. **Incomplete foundry-adapter.mjs** - Only 6 methods, but 50+ direct API calls

### Low Priority (Nice to Have)
13. **Caching for Derived Data** - prepareDerivedData recalculates everything on every update
14. **Constants Organization** - constants.mjs mixes different domains
15. **Debug Console Logs** - Direct console.log instead of Foundry logging API
16. **Static-Only Helper Classes** - All helpers use static methods (document pattern)

### Quick Wins (Do First!)
- **Error boundaries** for chat buttons (30 min)
- **Extract macros** to separate modules (15 min)
- **Remove commented code** (2 min)
- **Add JSDoc** to core helpers (1 hour)
- **HTML sanitization** (30 min)

---

## 🚀 Getting Started

### For Project Managers
1. Read [00-overview.md](00-overview.md) for executive summary
2. Review recommended action plan (Phase 1-4)
3. Prioritize issues based on project goals
4. Create implementation tasks/tickets

### For Developers
1. Start with [05-quick-wins.md](05-quick-wins.md) (2-3 hours of easy wins)
2. Tackle [01-critical-issues.md](01-critical-issues.md) next
3. Move to [02-high-priority.md](02-high-priority.md)
4. Lower priority items can be deferred

### Implementation Order
```
Phase 1 (Week 1): Critical Issues + Quick Wins
├─ Quick Win 1: Error boundaries (30 min)
├─ Quick Win 5: HTML sanitization (30 min)
├─ Issue #1: Complete error handling (9 hours)
├─ Issue #2: Complete sanitization (8 hours)
└─ Issue #3: Extract deathwatch.mjs (13 hours)

Phase 2 (Weeks 2-3): High Priority
├─ Issue #5: Performance (Map→Array) (5-8 hours) ⚡ Quick win
├─ Issue #4: Refactor sheet classes (28 hours)
├─ Issue #6: Standardize async/await (14 hours)
└─ Issue #7: Add JSDoc (18 hours)

Phase 3 (Weeks 4-7): Medium Priority (as time permits)
Phase 4 (Weeks 8-11): Low Priority (polish)
```

---

## 📊 Metrics & Goals

### Code Quality Targets
- **Max File Size**: 500 lines (currently 1160)
- **Max Function Size**: 75 lines (currently 200+)
- **Test Coverage**: Maintain 95%+
- **Error Handling**: 100% of async operations wrapped

### Performance Targets
- **Sheet Render**: <100ms
- **Modifier Collection**: <10ms
- **Memory**: Zero leaks

### Documentation Targets
- **JSDoc Coverage**: 80%+ of public APIs
- **Magic Numbers**: <10 total
- **Code Duplication**: <5%

---

## 🔍 Issue Tracking

### By Category

#### Architecture
- #3: Large initialization file
- #4: Sheet classes too large
- #11: Code duplication between sheets
- #12: Incomplete foundry-adapter

#### Code Quality
- #1: Missing error handling
- #6: Async/await consistency
- #7: Missing JSDoc
- #8: Magic numbers
- #9: Commented-out code
- #10: Long functions

#### Security
- #2: HTML injection risk

#### Performance
- #5: Map→Array conversions
- #13: Caching for derived data

#### Organization
- #14: Constants organization
- #15: Debug console logs
- #16: Static helper classes (document only)

---

## 📝 Documentation Format

Each improvement document follows this structure:

### Issue Structure
- **Problem**: What's wrong and why it matters
- **Impact**: Who is affected and how (users, developers, performance)
- **Solution**: Detailed implementation approach with code examples
- **Implementation Plan**: Step-by-step breakdown with time estimates
- **Testing Strategy**: How to verify the fix works
- **Success Criteria**: Measurable goals

### Code Examples
All documents include:
- ✅ Before/after code comparisons
- ✅ Working examples (not pseudocode)
- ✅ JSDoc annotations where relevant
- ✅ Import statements and file paths

---

## 🤝 Contributing

### Adding New Issues
1. Create new document: `NN-issue-name.md`
2. Follow existing format
3. Add to this README
4. Update 00-overview.md summary

### Updating Status
When work begins on an issue:
1. Update status in document (Planning → In Progress → Complete)
2. Update this README table
3. Create implementation branch: `improvement/NN-issue-name`

### Closing Issues
When implementation is complete:
1. Mark issue as ✅ Complete
2. Add "Completed" date
3. Link to PR/commit
4. Document any deviations from plan

---

## 📚 Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - System architecture and development guide
- [tests/](../../tests/) - Test suite (1567 tests across 95 suites)
- [docs/hotbar-macros.md](../hotbar-macros.md) - Hotbar macro documentation

---

## ❓ FAQ

### Q: Do we need to fix everything?
**A**: No. Critical and high-priority issues are recommended. Medium/low priority are nice-to-haves.

### Q: Can issues be done in parallel?
**A**: Yes! Most issues are independent. Exceptions noted in each document.

### Q: Will these changes break existing functionality?
**A**: No. All improvements maintain backward compatibility. Extensive test coverage (1567 tests) helps prevent regressions.

### Q: How long will this take?
**A**: 
- **Quick Wins**: 2-3 hours
- **Critical**: 1 week
- **High Priority**: 2-3 weeks
- **Medium Priority**: 3-4 weeks
- **Low Priority**: 1-2 weeks
- **Total**: 7-11 weeks (can be parallelized)

### Q: What if we find more issues?
**A**: Add new documents following the existing format. Prioritize based on impact and effort.

### Q: Should we do v1 or v2 sheets first?
**A**: Refactor both simultaneously using shared preparer modules (see Issue #4). This maintains feature parity.

---

## 📞 Contact

For questions about these improvements:
- Review the relevant issue document
- Check CLAUDE.md for architecture context
- Refer to existing tests for behavior examples

---

## 📅 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial assessment and documentation | Claude |
| 2026-04-05 | Created all improvement documents | Claude |

---

**Status Legend**:
- 📝 Planning - Document created, not yet started
- 🔨 In Progress - Implementation underway
- ✅ Complete - Implemented and tested
- ⏸️ Deferred - Postponed to future sprint
- ❌ Rejected - Decided not to implement
