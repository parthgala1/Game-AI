# Level Rating System

## Difficulty Rating (0.0 - 1.0)

The difficulty rating is based on the following factors:

### Pattern Complexity (0.0 - 1.0)

- 0.0 - 0.2: Simple horizontal or vertical patterns
- 0.2 - 0.4: Basic platform layouts with minimal variation
- 0.4 - 0.6: Mixed patterns with moderate complexity
- 0.6 - 0.8: Complex patterns with varied heights and gaps
- 0.8 - 1.0: Spiral patterns or highly intricate layouts

### Vertical Distribution

- Lower ratings: Platforms concentrated in few rows
- Higher ratings: Platforms spread across multiple heights

### Density Impact

- Lower ratings: Sparse platform placement
- Higher ratings: Dense platform clusters requiring precise navigation

### Pattern Features

- Spiral patterns: +0.2 difficulty bonus
- Symmetrical layouts: +0.1 difficulty bonus

## Score Rating (0.1 - 1.0)

The score rating evaluates level quality and playability:

### Block Count

- Influences overall level complexity
- Optimal range: 15-45 blocks

### Platform Distribution

- Horizontal spread
- Vertical spread
- Coverage across the level

### Level Structure

- Platform clustering
- Space utilization
- Pattern consistency

### Bonus Features

- Spiral patterns: +0.04 score bonus
- Symmetrical design: +0.02 score bonus

## Rating Examples

- Basic Level (d0.2, s0.3):

  - Simple horizontal platforms
  - Few blocks
  - Limited vertical movement

- Medium Level (d0.5, s0.6):

  - Mixed platform heights
  - Good block distribution
  - Moderate challenge

- Complex Level (d0.8, s0.8):
  - Intricate patterns
  - Multiple paths
  - High vertical variation
  - Strategic platform placement

# Level Generation AI API

This API provides endpoints for generating game levels using a GAN (Generative Adversarial Network) model.

## API Endpoints

### Generate Level

Generate a new game level based on difficulty and score parameters.

**Endpoint:** `/generate-level`
**Method:** `POST`

#### Request Body

```json
{
  "difficulty": 0.5, // Float between 0 and 1
  "score": 0.5 // Float between 0 and 1
}
```
