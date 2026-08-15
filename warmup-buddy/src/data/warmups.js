// src/data/warmups.js
// Local dataset of sport-specific warm-up exercises.
// Each item represents ONE exercise within a sport's warm-up routine.

export const WARMUPS = [
  { id: '1', sport: 'Football', exercise: 'Jogging in place', duration: '2 min', intensity: 'Low', description: 'Get blood flowing and raise your heart rate gradually.' },
  { id: '2', sport: 'Football', exercise: 'High knees', duration: '1 min', intensity: 'Medium', description: 'Activates hip flexors and quads for sprinting.' },
  { id: '3', sport: 'Football', exercise: 'Dynamic hamstring stretch', duration: '2 min', intensity: 'Low', description: 'Swing leg forward and back to loosen hamstrings.' },
  { id: '4', sport: 'Football', exercise: 'Lateral shuffles', duration: '2 min', intensity: 'Medium', description: 'Improves lateral agility for defensive movement.' },
  { id: '5', sport: 'Badminton', exercise: 'Arm circles', duration: '1 min', intensity: 'Low', description: 'Loosens shoulder joints before overhead shots.' },
  { id: '6', sport: 'Badminton', exercise: 'Wrist rotations', duration: '1 min', intensity: 'Low', description: 'Prepares wrists for repetitive racket movement.' },
  { id: '7', sport: 'Badminton', exercise: 'Footwork ladder drills', duration: '3 min', intensity: 'Medium', description: 'Builds court coverage speed and coordination.' },
  { id: '8', sport: 'Badminton', exercise: 'Shadow smashes', duration: '2 min', intensity: 'Medium', description: 'Rehearses smash motion without a shuttle.' },
  { id: '9', sport: 'Basketball', exercise: 'Jump rope', duration: '3 min', intensity: 'Medium', description: 'Raises heart rate and warms up calves/ankles.' },
  { id: '10', sport: 'Basketball', exercise: 'Dynamic lunges', duration: '2 min', intensity: 'Medium', description: 'Opens up hips for explosive first steps.' },
  { id: '11', sport: 'Basketball', exercise: 'Layup form shooting', duration: '3 min', intensity: 'Low', description: 'Grooves shooting motion at low intensity.' },
  { id: '12', sport: 'Running', exercise: 'Brisk walk', duration: '3 min', intensity: 'Low', description: 'Eases the body into movement before jogging.' },
  { id: '13', sport: 'Running', exercise: 'Leg swings', duration: '2 min', intensity: 'Low', description: 'Mobilizes hips in both directions.' },
  { id: '14', sport: 'Running', exercise: 'Strides (short sprints)', duration: '2 min', intensity: 'High', description: 'Primes fast-twitch muscles for pace running.' },
];

// Utility: unique list of sports, used to group the FlatList by sport.
export const SPORTS = [...new Set(WARMUPS.map(w => w.sport))];
