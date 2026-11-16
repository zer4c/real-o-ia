# Real o IA

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React, TypeScript, Vite, TensorFlow.js; Python, TensorFlow/Keras, scikit-learn in Google Colab. Recommended stack accepted by the user ("all its okey"). Browser-local inference without a backend.

## Product Purpose
Academic prototype comparing a binary CNN trained from scratch against independent unsupervised k-means (k=2) for authentic versus synthetic images.

## Users
A person uploads an image and compares the two model outputs on a single screen. Academic evaluation is the stated project context; further audience details remain open.

## Operating Context
Training occurs in Google Colab using CIFAKE: 100,000 training images and 20,000 test images, balanced REAL/FAKE. Real images originate in CIFAR-10; synthetic images in Stable Diffusion 1.4. This implementation must not run training or download the dataset.

## Capabilities and Constraints
One screen with image upload and clear controls; two model results with evaluation statistics and prediction details. Only approved additions: agreement indicator and 32-by-32 input preview. No report download, history, accounts, database, or extra screens. K-means features must not derive from the CNN. Associate clusters with REAL/FAKE using training labels only, after unsupervised fitting. Never fabricate model metrics or predictions. Trained artifacts are absent until the user runs Colab. Language follows the Spanish project brief.

## Evidence on Hand
User-supplied dataset description and assignment screenshot. No trained weights or measured metrics. CIFAKE performance does not establish general detection of modern generators.

## Product Principles
- Separate model output from ground truth.
- Keep both models independent and preprocessing consistent.
- Keep original and model-input previews explicit.
- Preserve the held-out test set for final evaluation.

## Confirmed Surface Update
User selected editorial option A, dark and normal modes; upload and image preview precede comparisons in a vertically scrolling page, following the provided layout reference. Preserve only model accuracy, F1, CNN FAKE score, k-means group/distance and agreement, plus required controls and relevant error states. No visual-direction selector or mock-result button.

## Package Manager
Use pnpm exclusively for dependency installation, development, build, and tests (explicit user requirement).
