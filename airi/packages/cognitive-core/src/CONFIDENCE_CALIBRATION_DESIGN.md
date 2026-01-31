# Confidence Calibration - Architecture Design

## Overview

This document outlines the architecture for implementing confidence calibration in the moeru-ai cognitive core. The system enables accurate estimation of confidence in relevance assessments, with calibration that improves over time through outcome feedback.

## Current State

The TODO at `packages/cognitive-core/src/relevance-coordinator.ts:95` states:
> `confidence: 0.8, // TODO: Implement confidence calibration`

Currently:
1. Confidence is hardcoded to 0.8 for all relevance assessments
2. No calibration based on actual prediction accuracy
3. No tracking of confidence vs. outcome correlation
4. No adaptive adjustment based on context or component scores

## Problem Statement

Uncalibrated confidence leads to:
- **Overconfidence**: Acting on uncertain assessments as if they were certain
- **Underconfidence**: Hesitating on well-supported assessments
- **Poor Decision Making**: Inability to appropriately weight uncertain information
- **No Learning**: System cannot improve confidence estimation over time

## Proposed Architecture

### 1. Confidence Calibration Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                  Confidence Calibration System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Raw        │    │  Calibrated  │    │   Outcome    │       │
│  │  Confidence  │───▶│  Confidence  │───▶│   Feedback   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│         │                   │                    │               │
│         ▼                   ▼                    ▼               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Calibration State Machine                │       │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │       │
│  │  │ Initial │─▶│Learning │─▶│Calibrated│─▶│Adaptive │  │       │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Core Components

#### 2.1 Raw Confidence Calculator

```typescript
interface RawConfidenceFactors {
  // Component agreement (how aligned are the component scores)
  componentAgreement: number;
  
  // Evidence strength (how strong is the supporting evidence)
  evidenceStrength: number;
  
  // Context familiarity (how similar to past successful contexts)
  contextFamiliarity: number;
  
  // Prediction stability (how stable is the prediction across perturbations)
  predictionStability: number;
  
  // Historical accuracy (past accuracy for similar assessments)
  historicalAccuracy: number;
}

interface RawConfidence {
  value: number;           // 0-1
  factors: RawConfidenceFactors;
  uncertainty: number;     // Epistemic uncertainty
}
```

#### 2.2 Calibration Engine

```typescript
interface CalibrationConfig {
  // Minimum samples before calibration activates
  minSamplesForCalibration: number;
  
  // Number of bins for reliability diagram
  calibrationBins: number;
  
  // Learning rate for calibration updates
  learningRate: number;
  
  // Decay factor for old observations
  decayFactor: number;
  
  // Temperature for Platt scaling
  plattTemperature: number;
  
  // Enable isotonic regression
  useIsotonicRegression: boolean;
}

interface CalibrationState {
  // Calibration curve (maps raw confidence to calibrated)
  calibrationCurve: Map<number, number>;
  
  // Reliability statistics per bin
  reliabilityBins: ReliabilityBin[];
  
  // Expected Calibration Error (ECE)
  expectedCalibrationError: number;
  
  // Maximum Calibration Error (MCE)
  maxCalibrationError: number;
  
  // Brier score (proper scoring rule)
  brierScore: number;
  
  // Total samples processed
  sampleCount: number;
}
```

#### 2.3 Outcome Tracker

```typescript
interface OutcomeRecord {
  // Unique identifier
  id: string;
  
  // The relevance assessment
  relevanceScore: RelevanceScore;
  
  // Raw confidence before calibration
  rawConfidence: number;
  
  // Calibrated confidence
  calibratedConfidence: number;
  
  // Actual outcome (ground truth)
  outcome: 'success' | 'failure' | 'neutral';
  
  // Binary outcome for calibration
  binaryOutcome: number;  // 1 for success, 0 for failure
  
  // Context features for stratified calibration
  contextFeatures: Record<string, unknown>;
  
  // Timestamp
  timestamp: number;
}
```

### 3. Calibration Methods

#### 3.1 Platt Scaling

Logistic regression to map raw confidence to calibrated probability:

```typescript
// Platt scaling: P(y=1|f) = 1 / (1 + exp(A*f + B))
function plattScale(rawConfidence: number, A: number, B: number): number {
  return 1 / (1 + Math.exp(A * rawConfidence + B));
}
```

#### 3.2 Isotonic Regression

Non-parametric calibration that preserves ordering:

```typescript
// Isotonic regression: monotonically increasing mapping
function isotonicCalibrate(
  rawConfidence: number,
  calibrationCurve: Map<number, number>
): number {
  // Find nearest points and interpolate
  const points = Array.from(calibrationCurve.entries())
    .sort((a, b) => a[0] - b[0]);
  
  // Binary search and linear interpolation
  // ...
}
```

#### 3.3 Temperature Scaling

Simple but effective for neural network outputs:

```typescript
// Temperature scaling: softmax(z/T)
function temperatureScale(rawConfidence: number, temperature: number): number {
  // For binary case, apply to logit
  const logit = Math.log(rawConfidence / (1 - rawConfidence));
  const scaledLogit = logit / temperature;
  return 1 / (1 + Math.exp(-scaledLogit));
}
```

### 4. Reliability Metrics

#### 4.1 Expected Calibration Error (ECE)

```typescript
// ECE = Σ (|B_m| / n) * |acc(B_m) - conf(B_m)|
function calculateECE(bins: ReliabilityBin[]): number {
  const totalSamples = bins.reduce((sum, bin) => sum + bin.count, 0);
  
  return bins.reduce((ece, bin) => {
    if (bin.count === 0) return ece;
    const weight = bin.count / totalSamples;
    const gap = Math.abs(bin.accuracy - bin.averageConfidence);
    return ece + weight * gap;
  }, 0);
}
```

#### 4.2 Brier Score

```typescript
// Brier Score = (1/n) * Σ (f_i - o_i)²
function calculateBrierScore(records: OutcomeRecord[]): number {
  const sum = records.reduce((acc, record) => {
    const diff = record.calibratedConfidence - record.binaryOutcome;
    return acc + diff * diff;
  }, 0);
  
  return sum / records.length;
}
```

### 5. Confidence Calculation Algorithm

```typescript
async function calculateConfidence(
  possibility: Possibility,
  context: CognitiveContext,
  components: RelevanceScore['components']
): Promise<{ confidence: number; factors: RawConfidenceFactors }> {
  
  // 1. Component Agreement
  const componentValues = Object.values(components);
  const mean = componentValues.reduce((a, b) => a + b) / componentValues.length;
  const variance = componentValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / componentValues.length;
  const componentAgreement = 1 - Math.sqrt(variance);  // Higher agreement = lower variance
  
  // 2. Evidence Strength
  const evidenceStrength = calculateEvidenceStrength(possibility, context);
  
  // 3. Context Familiarity
  const contextFamiliarity = calculateContextFamiliarity(context);
  
  // 4. Prediction Stability
  const predictionStability = await calculatePredictionStability(possibility, context);
  
  // 5. Historical Accuracy
  const historicalAccuracy = getHistoricalAccuracy(possibility.type, context);
  
  // Combine factors
  const factors = {
    componentAgreement,
    evidenceStrength,
    contextFamiliarity,
    predictionStability,
    historicalAccuracy,
  };
  
  // Weighted combination
  const rawConfidence = 
    0.25 * componentAgreement +
    0.20 * evidenceStrength +
    0.15 * contextFamiliarity +
    0.15 * predictionStability +
    0.25 * historicalAccuracy;
  
  return { confidence: rawConfidence, factors };
}
```

### 6. Calibration State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    Calibration State Machine                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    n≥min     ┌──────────┐    ECE<0.1   ┌─────────┐
│   │ INITIAL  │─────────────▶│ LEARNING │─────────────▶│CALIBRATED│
│   └──────────┘              └──────────┘              └─────────┘
│        │                         │                         │
│        │                         │                         │
│        │ Use prior               │ Use Platt               │ Use full
│        │ (0.5 default)           │ scaling                 │ calibration
│        │                         │                         │
│        │                         ▼                         ▼
│        │                    ┌──────────┐              ┌─────────┐
│        │                    │ DEGRADED │◀─────────────│ADAPTIVE │
│        │                    └──────────┘   ECE>0.15   └─────────┘
│        │                         │                         │
│        │                         │ Recalibrate             │
│        └─────────────────────────┴─────────────────────────┘
│                                                                  │
│   States:                                                        │
│   - INITIAL: Not enough data, use prior                          │
│   - LEARNING: Collecting data, basic calibration                 │
│   - CALIBRATED: Full calibration active                          │
│   - ADAPTIVE: Continuous recalibration                           │
│   - DEGRADED: Calibration quality dropped, recalibrating         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Integration with Relevance Coordinator

```typescript
// In RelevanceCoordinator.calculateRelevance()
async calculateRelevance(
  possibility: Possibility,
  context: CognitiveContext
): Promise<RelevanceScore> {
  const components = {
    novelty: this.assessNovelty(possibility, context),
    emotional: this.assessEmotionalResonance(possibility, context),
    pragmatic: this.assessPragmaticValue(possibility, context),
    coherence: this.assessCoherence(possibility, context),
    epistemic: this.assessEpistemicValue(possibility, context),
  };
  
  const overall = this.calculateWeightedSum(components);
  
  // Calculate and calibrate confidence
  const { confidence, factors } = await this.confidenceCalibrator.calculate(
    possibility,
    context,
    components
  );
  
  const calibratedConfidence = this.confidenceCalibrator.calibrate(confidence);
  
  return {
    overall,
    components,
    confidence: calibratedConfidence,
    reasoning: this.generateReasoning(components, overall),
    // Include raw confidence and factors for debugging
    _debug: {
      rawConfidence: confidence,
      confidenceFactors: factors,
      calibrationState: this.confidenceCalibrator.getState(),
    },
  };
}
```

### 8. File Structure

```
packages/cognitive-core/src/
├── confidence/
│   ├── types.ts                    # Confidence type definitions
│   ├── raw-confidence.ts           # Raw confidence calculation
│   ├── calibration-engine.ts       # Calibration algorithms
│   ├── outcome-tracker.ts          # Outcome tracking and storage
│   ├── reliability-metrics.ts      # ECE, Brier score, etc.
│   ├── confidence-calibrator.ts    # Main calibrator class
│   └── index.ts                    # Module exports
├── relevance-coordinator.ts        # Updated with calibration
└── types.ts                        # Updated with confidence types
```

### 9. Configuration Options

```typescript
interface ConfidenceCalibrationConfig {
  // Calibration method
  method: 'platt' | 'isotonic' | 'temperature' | 'ensemble';
  
  // Minimum samples before calibration
  minSamples: number;  // default: 30
  
  // Number of bins for reliability diagram
  numBins: number;  // default: 10
  
  // Learning rate for online updates
  learningRate: number;  // default: 0.1
  
  // Decay factor for old observations
  decayFactor: number;  // default: 0.99
  
  // ECE threshold for calibration quality
  eceThreshold: number;  // default: 0.1
  
  // Enable stratified calibration by context
  stratifiedByContext: boolean;  // default: true
  
  // Context features for stratification
  stratificationFeatures: string[];  // default: ['environment.type', 'task']
  
  // Prior confidence when uncalibrated
  priorConfidence: number;  // default: 0.5
  
  // Enable uncertainty quantification
  quantifyUncertainty: boolean;  // default: true
}
```

### 10. Events and Callbacks

```typescript
interface ConfidenceCalibrationEvents {
  // Calibration state changed
  'state-change': { from: CalibrationState; to: CalibrationState };
  
  // Calibration quality metrics updated
  'metrics-updated': { ece: number; mce: number; brierScore: number };
  
  // Calibration degraded (ECE above threshold)
  'calibration-degraded': { ece: number; threshold: number };
  
  // Recalibration completed
  'recalibration-complete': { newECE: number; samplesUsed: number };
  
  // Outcome recorded
  'outcome-recorded': { record: OutcomeRecord };
  
  // Debug information
  'debug': { message: string; data?: unknown };
}
```

## Implementation Plan

### Phase 1: Core Types and Raw Confidence
1. Define confidence types in `confidence/types.ts`
2. Implement raw confidence calculation in `raw-confidence.ts`
3. Add component agreement, evidence strength calculations

### Phase 2: Calibration Engine
1. Implement Platt scaling in `calibration-engine.ts`
2. Add isotonic regression
3. Implement temperature scaling
4. Create ensemble method

### Phase 3: Outcome Tracking
1. Create `OutcomeTracker` class
2. Implement outcome storage and retrieval
3. Add context feature extraction

### Phase 4: Reliability Metrics
1. Implement ECE calculation
2. Add Brier score
3. Create reliability diagram data

### Phase 5: Integration
1. Create `ConfidenceCalibrator` main class
2. Update `RelevanceCoordinator` to use calibrator
3. Connect outcome reporting to calibration

### Phase 6: Testing & Polish
1. Add unit tests for calibration methods
2. Test with synthetic data
3. Tune default parameters

## Usage Example

```typescript
import { RelevanceCoordinator } from './relevance-coordinator';
import { ConfidenceCalibrator } from './confidence';

const coordinator = new RelevanceCoordinator({
  confidenceCalibration: {
    method: 'ensemble',
    minSamples: 30,
    stratifiedByContext: true,
  },
});

// Calculate relevance with calibrated confidence
const relevance = await coordinator.calculateRelevance(possibility, context);
console.log(`Confidence: ${relevance.confidence} (calibrated)`);

// Report outcome for learning
await coordinator.reportOutcome(possibility, relevance, 'success');

// Check calibration quality
const metrics = coordinator.getCalibrationMetrics();
console.log(`ECE: ${metrics.ece}, Brier: ${metrics.brierScore}`);
```
