# Code Improvements Overview

**Date**: 2026-04-05  
**Status**: Planning Phase  
**Codebase Version**: Current `claude` branch

---

## Executive Summary

The Deathwatch system codebase is well-architected with strong separation of concerns, comprehensive testing (1567 tests), and thoughtful design patterns. The identified improvements are primarily **scale-related** (files grew too large) and **defensive programming** (error handling, validation). No major architectural rewrites are needed.

## Issue Categories

| Priority | Document | Issues | Estimated Effort |
|----------|----------|--------|------------------|
| 🔴 Critical | [01-critical-issues.md](01-critical-issues.md) | 3 | 1 week |
| 🟡 High | [02-high-priority.md](02-high-priority.md) | 4 | 2-3 weeks |
| 🟢 Medium | [03-medium-priority.md](03-medium-priority.md) | 6 | 3-4 weeks |
| 🔵 Low | [04-low-priority.md](04-low-priority.md) | 4 | 1-2 weeks |
| ⚡ Quick Wins | [05-quick-wins.md](05-quick-wins.md) | 5 | 2-3 hours |

**Total Issues**: 22  
**Total Estimated Effort**: 7-11 weeks (can be parallelized)

---

## Recommended Action Plan

### Phase 1: Foundation (Week 1)
**Goal**: Improve stability and security

- ✅ Error handling wrappers for all event handlers
- ✅ HTML sanitization in chat messages
- ✅ Extract `deathwatch.mjs` into modular structure

**Deliverables**:
- Zero unhandled promise rejections
- XSS-proof chat messages
- `src/module/init/` directory with hooks, settings, socket, macros

### Phase 2: Code Quality (Weeks 2-3)
**Goal**: Improve maintainability

- ✅ Refactor large sheet classes
- ✅ Fix performance bottlenecks (Map→Array conversions)
- ✅ Standardize async/await patterns
- ✅ Add JSDoc to public APIs

**Deliverables**:
- Sheet classes under 400 lines each
- 20% performance improvement in modifier collection
- Type-safe helper APIs

### Phase 3: Technical Debt (Weeks 4-7)
**Goal**: Reduce maintenance burden

- ✅ Extract magic numbers to constants
- ✅ Break down long functions (>100 lines)
- ✅ Eliminate code duplication between v1/v2 sheets
- ✅ Complete foundry-adapter.mjs coverage

**Deliverables**:
- All constants documented
- Maximum function length: 75 lines
- Shared sheet logic extracted

### Phase 4: Optimization (Weeks 8-11)
**Goal**: Polish and optimize

- ✅ Implement caching for derived data
- ✅ Reorganize constants by domain
- ✅ Standardize logging
- ✅ Evaluate helper class patterns

**Deliverables**:
- 30-50% faster character sheet rendering
- Consistent logging infrastructure

---

## Success Metrics

### Code Quality
- **Test Coverage**: Maintain 95%+ (currently high)
- **Max File Size**: 500 lines (currently 1160 max)
- **Max Function Size**: 75 lines (currently 200+ in some cases)
- **Error Handling**: 100% of async operations wrapped

### Performance
- **Sheet Render Time**: <100ms (measure baseline first)
- **Modifier Collection**: <10ms per actor
- **Memory**: No leaks (use Chrome DevTools profiler)

### Maintainability
- **JSDoc Coverage**: 80%+ of public APIs
- **Magic Numbers**: <10 in entire codebase
- **Code Duplication**: <5% (use jscpd tool)

---

## Risk Assessment

### Low Risk ✅
- Quick wins (error handling, HTML sanitization)
- Documentation improvements
- Extract helper utilities

### Medium Risk ⚠️
- Refactoring large sheet classes (high test coverage mitigates)
- Async pattern standardization (potential breakage)
- Performance optimizations (need benchmarks)

### High Risk 🔴
- Foundry adapter completion (requires testing all Foundry API calls)
- Caching implementation (complex invalidation logic)

---

## Implementation Strategy

### Approach
1. **Test-First**: Write/update tests before refactoring
2. **Incremental**: Small PRs, one issue at a time
3. **Backward Compatible**: No breaking changes for existing worlds
4. **Benchmarked**: Measure performance before/after

### Branch Strategy
```
claude (current)
  ├── improvement/01-error-handling
  ├── improvement/02-extract-deathwatch-init
  ├── improvement/03-refactor-sheets
  └── ...
```

Merge to `claude` after review, then PR to `main` in batches.

### Review Process
1. Developer implements from docs
2. Run `npm test` (all tests must pass)
3. Manual QA in Foundry
4. Code review (focus on patterns/conventions)
5. Merge if approved

---

## Dependencies

### External
- None (all improvements are internal)

### Internal
- Test suite must remain green throughout
- v1 and v2 sheets must stay in sync during refactoring

---

## Open Questions

1. **Sheet Migration**: Should we prioritize v2 sheet migration or maintain parity?
   - **Recommendation**: Maintain parity until v2 is feature-complete, then deprecate v1

2. **Breaking Changes**: Are we allowed breaking changes for improvement?
   - **Assumption**: No breaking changes for existing worlds (Foundry compatibility)

3. **Performance Targets**: What are acceptable sheet render times?
   - **Action**: Establish baseline metrics before Phase 4

4. **Testing Strategy**: How much integration testing vs unit testing?
   - **Current**: Heavy unit testing (95%+), light integration testing
   - **Recommendation**: Maintain current balance

---

## Next Steps

1. ✅ Review this overview document
2. ⬜ Review individual issue documents (01-05)
3. ⬜ Prioritize issues (mark must-have vs nice-to-have)
4. ⬜ Create implementation tasks
5. ⬜ Assign to sprints/milestones
6. ⬜ Begin Phase 1 implementation

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial assessment and documentation | Claude |
