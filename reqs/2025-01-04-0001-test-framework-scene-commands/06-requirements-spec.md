# Requirements Specification: Test Framework for SCENE Command Overlays

**Date:** 2025-01-04  
**Version:** 1.0

## Problem Statement

The SCENE (Sequenced Contexts Enabling Narrative Execution) system lacks a comprehensive testing framework for validating command overlay files that AI models parse and execute. Commands must be tested across multiple computational contexts (NORMAL, DIAGNOSTIC, FORENSIC, etc.) to ensure they produce correct behavioral outputs according to their specifications. The framework needs to validate not just correctness, but the performative nature of language-based computation.

## Context: SCENE as AI-Executable Behavioral DSL

Before diving into requirements, it's essential to understand what SCENE commands are:

1. **SCENE is a behavioral DSL** implemented using YAML syntax, formally defined in `/docs/scene-grammar-spec-v1.2.txt`
2. **Commands are YAML files** that follow the SCENE grammar specification v1.2 (EBNF + Behavioral Semantics)
3. **These files are designed for AI models** to parse and execute as behavioral overlays
4. **The YAML syntax enables AI models** to manifest specific behaviors through structured language patterns
5. **Commands inherit from engine.in** and specialize behavior through canonical `you:` blocks

## Functional Requirements

### FR1: SCENE-Compliant YAML Parsing
- Parse SCENE-compliant YAML command overlay files from `/reason/command-overlays/`
- Validate conformance to SCENE grammar specification v1.2 (EBNF+B)
- Extract canonical `you:` blocks (are/must/understand) for AI behavioral validation
- Parse state definitions, behavioral contracts, and output requirements per SCENE grammar
- Support inheritance from engine.in with dot-notation overrides

### FR2: Behavioral Output Validation
- Validate that commands produce required language outputs for each state
- Verify state transition evidence (e.g., "Let me understand..." for CONTEXT)
- Check for required expert spawning and dialogue patterns
- Validate calculation performances (CALCULATE_EXACT patterns)

### FR3: Multi-Scene Testing
- Test each command under all 5 SCENE contexts
- Apply scene-specific parameter modifications during testing
- Verify behavioral adaptations match scene requirements
- Support scene transition testing

### FR4: Automated Test Generation
- Generate test cases from YAML specifications
- Create test variations for each scene context
- Generate static user inputs and interjections
- Produce expected output patterns from contracts

### FR5: Pass/Fail Matrix Reporting
- Binary pass/fail evaluation for each criterion
- Organize results in category matrices:
  - State Manifestation
  - Calculation Performance
  - Visibility Compliance
  - Behavioral Contracts
- Support critical fail criteria that override pass counts

## Technical Requirements

### TR1: SCENE Grammar Parsing Infrastructure
- YAML parser supporting SCENE grammar v1.2 constructs
- Validation against EBNF+B specification from `/docs/scene-grammar-spec-v1.2.txt`
- Dot-path resolution for AI model reference system (e.g., `engine.dynamics.uncertainty.fork`)
- Canonical form validation for AI behavioral `you:` blocks
- Scene overlay application logic for AI context switching

### TR2: AI Behavioral Validation Engine
- Pattern matching for AI language behavioral outputs
- CALCULATE_EXACT verification of AI performative calculations
- Expert dialogue structure validation in AI responses
- State evidence contract checking for AI behavioral manifestation
- Validation that AI correctly interprets and executes YAML overlays

### TR3: AI Model Simulation Framework
- Isolated test environment per command/scene combination
- AI behavioral state machine simulation with language output capture
- Static interjection injection to test AI adaptation patterns
- Parallel test execution support for multiple AI behavioral overlays
- Simulation of AI model parsing and executing YAML behavioral instructions

### TR4: Reporting System
- Extended format beyond current `/test_results/`
- Comprehensive coverage metrics per command
- Scene-specific performance analysis
- Pass/fail matrices with detailed criteria breakdowns
- Markdown output for human readability

### TR5: Integration
- Command-line interface for test execution
- Integration with existing codebase structure
- Support for selective testing (single command/scene)
- Test suite configuration management

## Implementation Hints

### Existing Patterns to Leverage
- Binary criteria structure from `/test_suites/test_suite_*.md`
- State flow patterns from `engine.in` (AI behavioral engine)
- Scene modification logic from `SCENE_PROPOSAL.md`
- Calculation patterns from `behavioral_contracts` section
- SCENE grammar validation from `/docs/scene-grammar-spec-v1.2.txt`
- AI behavioral manifestation patterns from canonical `you:` blocks

### Key Files to Reference
- `/reason/command-overlays/engine.in` - Core AI behavioral engine specification
- `/reason/command-overlays/consider.in` - Example AI command overlay implementation
- `/docs/scene-grammar-spec-v1.2.txt` - Formal SCENE grammar (EBNF+B) for AI parsing
- `/test_suites/test_suite_01_medical_diagnosis.md` - Test structure example
- Command overlays are YAML files that AI models parse to manifest specific behaviors

### Technical Approach
1. Validate SCENE grammar v1.2 compliance (EBNF+B)
2. Parse YAML as AI behavioral overlay → Extract testable contracts
3. Generate test scenarios per scene context
4. Simulate AI model execution with behavioral output capture
5. Match AI language outputs against behavioral contracts
6. Verify performative calculations (CALCULATE_EXACT patterns)
7. Produce pass/fail matrices for AI behavioral compliance

## Acceptance Criteria

### AC1: Core Functionality
- [ ] Successfully parses all command YAML files in `/reason/command-overlays/`
- [ ] Generates executable tests from YAML specifications
- [ ] Validates behavioral outputs against contracts
- [ ] Tests commands under all 5 SCENE contexts

### AC2: Validation Accuracy
- [ ] Correctly identifies CALCULATE_EXACT patterns and verifies results
- [ ] Validates canonical `you:` blocks structure
- [ ] Detects missing state evidence outputs
- [ ] Verifies expert spawning and dialogue

### AC3: Reporting Quality
- [ ] Generates pass/fail matrices for all criteria categories
- [ ] Produces comprehensive test reports in extended format
- [ ] Provides clear failure diagnostics
- [ ] Supports both summary and detailed views

### AC4: Automation
- [ ] Automatically generates tests from YAML without manual intervention
- [ ] Supports batch testing of all commands
- [ ] Enables selective testing by command or scene
- [ ] Maintains test configuration persistence

### AC5: Integration
- [ ] Integrates smoothly with existing codebase
- [ ] Follows established patterns from test suites
- [ ] Outputs reports to appropriate directories
- [ ] Provides clear CLI interface

## Assumptions

- Static interjections are sufficient (no dynamic user simulation needed)
- Commands are YAML files following SCENE grammar v1.2 for AI parsing
- AI models will parse and execute these YAML behavioral overlays
- Test execution can be isolated from production environment
- Pass/fail binary evaluation is adequate for all criteria
- Scene contexts are well-defined and stable per SCENE specification

## Success Metrics

- 100% of commands have automated test coverage
- All 5 SCENE contexts tested for each command
- Test generation requires no manual test writing
- Reports provide actionable failure information
- Framework catches behavioral contract violations effectively
