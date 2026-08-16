(function (root) {
  'use strict';

  const VERSION = '2.0.0';
  const OFFICIAL_BASE = 'https://apstudents.collegeboard.org/courses/';
  const CENTRAL_BASE = 'https://apcentral.collegeboard.org/courses/';

  function unit(name, weight, concepts) {
    return { name, weight, concepts: concepts.map(function (entry) {
      return { name: entry[0], teach: entry[1], trap: entry[2] || 'Do not substitute a memorized keyword for the reasoning the prompt asks you to show.' };
    }) };
  }

  function task(id, name, minutes, points, rubric, promptFrame) {
    return { id, name, minutes, points, rubric, promptFrame };
  }

  const COMMON = {
    science: [
      'State a defensible claim that answers the command word.',
      'Use the supplied data, model, or observation as specific evidence.',
      'Connect the evidence to the claim with course reasoning.',
      'Show calculations, units, and an interpretation when quantitative work is requested.'
    ],
    history: [
      'Answer the prompt with a historically defensible thesis or direct claim.',
      'Use specific historical evidence rather than a label alone.',
      'Explain how the evidence supports the argument.',
      'Apply the requested reasoning process: causation, comparison, or continuity and change.'
    ],
    essay: [
      'Present a defensible thesis that responds to the prompt.',
      'Use specific evidence from the text, sources, or relevant knowledge.',
      'Explain the relationship between evidence and the line of reasoning.',
      'Maintain a coherent organization and address complexity where appropriate.'
    ],
    quantitative: [
      'Identify the correct model, relationship, or representation.',
      'Show a valid setup and enough work to follow the reasoning.',
      'State the answer with units and interpret it in context.',
      'Justify conclusions using mathematical or statistical properties.'
    ]
  };

  const subjects = [
    {
      id: 'apcsp', name: 'AP Computer Science Principles', short: 'AP CSP', emoji: '💻', category: 'Computer Science', color: '#e8eef8', slug: 'ap-computer-science-principles',
      exam: { mode: 'hybrid digital + portfolio', duration: 180, mcq: { count: 70, minutes: 120, weight: 70 }, written: { count: 2, minutes: 60, weight: 30 }, note: 'The Create performance task is completed in class; written responses use the student-authored Personalized Project Reference.' },
      units: [
        unit('Unit 1: Creative Development', '10–13%', [['program purpose', 'A program’s purpose states the problem or creative intent it addresses and is distinct from the mechanics of its implementation.'], ['iterative development', 'Programs improve through cycles of design, implementation, testing, feedback, and revision.']]),
        unit('Unit 2: Data', '17–22%', [['data abstraction', 'A collection such as a list manages related data and can reduce complexity when it replaces many separate variables.'], ['data compression', 'Lossless compression preserves every bit of the original; lossy compression trades exact reconstruction for smaller size.']]),
        unit('Unit 3: Algorithms and Programming', '30–35%', [['algorithmic efficiency', 'Algorithms can be compared by how their resource use grows as input size increases, not only by one timed run.'], ['procedural abstraction', 'A named procedure with parameters hides implementation details and supports reuse with different inputs.']]),
        unit('Unit 4: Computer Systems and Networks', '11–15%', [['fault tolerance', 'Redundant routes and components allow a distributed system to keep working when part of it fails.'], ['internet protocols', 'Open protocols define agreed rules for addressing, routing, and reliable transfer across heterogeneous networks.']]),
        unit('Unit 5: Impact of Computing', '21–26%', [['digital divide', 'Unequal access, design, and participation can distribute computing benefits and harms unevenly.'], ['privacy tradeoffs', 'Combining datasets can reveal information not obvious in either source, so anonymization alone may not prevent reidentification.']])
      ],
      tasks: [
        task('create-purpose', 'Create: Program Design, Function, and Purpose', 15, 3, ['Identify the program purpose and intended user.', 'Describe the input and the program behavior.', 'Explain how the selected code contributes to the purpose.'], 'Use a short program scenario to explain its purpose, input, behavior, and output.'),
        task('create-algorithm', 'Create: Algorithm Development', 15, 3, ['Identify sequencing, selection, and iteration.', 'Explain how the algorithm works in enough detail to recreate it.', 'Use the Personalized Project Reference accurately.'], 'Explain how a student-developed algorithm combines sequencing, selection, and iteration.'),
        task('create-testing', 'Create: Errors and Testing', 15, 3, ['Describe two calls or test cases.', 'State the condition tested by each case.', 'Give the expected result and explain what the test establishes.'], 'Design two meaningfully different test cases for a procedure.'),
        task('create-abstraction', 'Create: Data and Procedural Abstraction', 15, 3, ['Explain what the list data represents.', 'Explain how the list manages complexity.', 'Describe a valid equivalent change or procedure behavior.'], 'Explain how a list or procedure manages complexity in a student program.')
      ]
    },
    {
      id: 'apcsa', name: 'AP Computer Science A', short: 'AP CSA', emoji: '⌨️', category: 'Computer Science', color: '#e8eef8', slug: 'ap-computer-science-a',
      exam: { mode: 'fully digital', duration: 180, mcq: { count: 42, minutes: 105, weight: 55 }, written: { count: 4, minutes: 75, weight: 45 }, note: 'The 2027 exam has 42 multiple-choice questions and four Java free-response tasks.' },
      units: [
        unit('Unit 1: Using Objects and Methods', '15–25%', [['object state', 'Instance variables store an object’s state while methods define behaviors that can read or modify that state.'], ['method signature', 'A method signature uses its name and parameter types; return type determines what value a call produces.']]),
        unit('Unit 2: Selection and Iteration', '25–35%', [['short-circuit evaluation', 'In a compound Boolean expression, later operands may not be evaluated once the result is determined.'], ['loop invariant', 'A loop invariant is a condition that remains true before and after each iteration and helps justify correctness.']]),
        unit('Unit 3: Class Creation', '10–18%', [['encapsulation', 'Private instance variables and public methods protect representation details while exposing controlled behavior.'], ['constructor contract', 'A constructor initializes new object state and has the same name as the class with no return type.']]),
        unit('Unit 4: Data Collections', '30–40%', [['ArrayList mutation', 'Removing an element shifts later indices left, so forward removal loops can accidentally skip an element.'], ['2D traversal', 'Row-major traversal processes every column of one row before moving to the next row.']])
      ],
      tasks: [
        task('methods', 'Methods and Control Structures', 18, 9, COMMON.quantitative, 'Write a Java method that uses parameters, selection, and iteration to satisfy a stated contract.'),
        task('class-design', 'Class Design', 18, 9, ['Declare appropriate private instance variables.', 'Write a constructor that establishes valid state.', 'Implement methods that preserve the class contract.', 'Use correct Java syntax and return behavior.'], 'Design a Java class from a behavioral specification.'),
        task('arraylist', 'Data Analysis with ArrayList', 18, 9, ['Traverse the collection safely.', 'Apply the requested condition to each relevant element.', 'Handle index shifts or enhanced-for restrictions correctly.', 'Return or mutate exactly as specified.'], 'Analyze or modify an ArrayList while respecting index behavior.'),
        task('2d-array', '2D Array', 18, 9, ['Use valid row and column bounds.', 'Traverse the required cells in the correct order.', 'Accumulate or update values correctly.', 'Return the requested result.'], 'Process a two-dimensional array to compute or transform a result.')
      ]
    },
    {
      id: 'apcalcab', name: 'AP Calculus AB', short: 'AP Calc AB', emoji: '📐', category: 'Mathematics', color: '#f0e8ff', slug: 'ap-calculus-ab',
      exam: { mode: 'hybrid digital', duration: 190, mcq: { count: 42, minutes: 100, weight: 50 }, written: { count: 6, minutes: 90, weight: 50 }, note: 'Calculator use is limited to the designated parts: 13 MCQs and two FRQs.' },
      units: [
        unit('Unit 1: Limits and Continuity', '10–12%', [['continuity', 'A function is continuous at a point when the limit exists, the function value exists, and the two are equal.'], ['limit from a table', 'A limit describes nearby behavior and can exist even when the function value differs or is undefined.']]),
        unit('Unit 2: Differentiation: Definition and Properties', '10–12%', [['derivative as rate', 'A derivative is an instantaneous rate of change and the slope of the tangent line at a point.'], ['differentiability', 'Differentiability implies continuity, but a continuous graph can fail to be differentiable at a corner, cusp, vertical tangent, or discontinuous derivative.']]),
        unit('Unit 3: Composite, Implicit, and Inverse Functions', '9–13%', [['chain rule', 'Differentiate a composition by multiplying the derivative of the outer function evaluated at the inner function by the inner derivative.'], ['implicit differentiation', 'Differentiate both sides with respect to the independent variable and include the dependent derivative on terms containing the dependent variable.']]),
        unit('Unit 4: Contextual Applications of Differentiation', '10–15%', [['related rates', 'Relate changing quantities with an equation, differentiate with respect to time, then substitute values with units.'], ['linearization', 'A tangent-line approximation is most reliable near the point of tangency and uses f(a)+f′(a)(x−a).']]),
        unit('Unit 5: Analytical Applications of Differentiation', '15–18%', [['mean value theorem', 'Continuity on a closed interval and differentiability inside it guarantee an instantaneous rate equal to the average rate.'], ['optimization', 'A contextual extremum is found by analyzing critical points and endpoints within the feasible domain.']]),
        unit('Unit 6: Integration and Accumulation', '17–20%', [['fundamental theorem', 'The derivative of an accumulation function recovers the integrand, adjusted by the chain rule for a variable bound.'], ['net change', 'A definite integral of a rate gives net change; total change requires accounting for sign or integrating absolute value.']]),
        unit('Unit 7: Differential Equations', '6–12%', [['slope field', 'A slope field encodes the derivative at sample points and solution curves must remain tangent to its segments.'], ['separable equation', 'Separate variables, integrate both sides, include a constant, and use an initial condition when provided.']]),
        unit('Unit 8: Applications of Integration', '10–15%', [['average value', 'The average value of f on [a,b] is the integral divided by interval length.'], ['volume by cross sections', 'Integrate cross-sectional area perpendicular to the axis, using bounds and dimensions from the same variable.']])
      ],
      tasks: [task('calc-active', 'Calculator-Active FRQ', 15, 9, COMMON.quantitative, 'Analyze a table, graph, or contextual rate using calculator-supported numerical work.'), task('calc-free', 'Calculator-Free FRQ', 15, 9, COMMON.quantitative, 'Build a symbolic argument involving derivatives, integrals, or a differential equation.')]
    },
    {
      id: 'apcalcbc', name: 'AP Calculus BC', short: 'AP Calc BC', emoji: '📏', category: 'Mathematics', color: '#f0e8ff', slug: 'ap-calculus-bc',
      exam: { mode: 'hybrid digital', duration: 190, mcq: { count: 42, minutes: 100, weight: 50 }, written: { count: 6, minutes: 90, weight: 50 }, note: 'BC includes all AB topics plus parametric, polar, vector-valued, and infinite-series content.' },
      units: [
        unit('Units 1–5: Differential Calculus', '32–39%', [['L’Hospital’s rule', 'For an indeterminate 0/0 or ∞/∞ form, the ratio of derivatives can evaluate the limit when the theorem’s conditions hold.'], ['Euler’s method', 'Euler’s method advances by new value = old value + step size times the slope at the old point.']]),
        unit('Units 6–8: Integral Calculus', '30–37%', [['integration by parts', 'Integration by parts reverses the product rule: ∫u dv = uv − ∫v du.'], ['improper integral', 'An integral with an infinite bound or unbounded integrand is defined by a limit and may converge or diverge.']]),
        unit('Unit 9: Parametric, Polar, and Vector-Valued Functions', '11–12%', [['parametric slope', 'For parametric curves, dy/dx equals (dy/dt)/(dx/dt) where dx/dt is nonzero.'], ['polar area', 'Area swept by a polar curve is one half the integral of r squared with respect to angle.']]),
        unit('Unit 10: Infinite Sequences and Series', '17–18%', [['convergence test choice', 'A series test must match the structure; comparison, ratio, integral, alternating, and geometric tests prove different claims.'], ['Taylor remainder', 'A remainder bound controls approximation error and must use a valid derivative bound or alternating-series condition.']])
      ],
      tasks: [task('bc-active', 'Calculator-Active FRQ', 15, 9, COMMON.quantitative, 'Analyze a contextual, parametric, polar, or accumulation model with calculator-supported work.'), task('bc-free', 'Calculator-Free FRQ', 15, 9, COMMON.quantitative, 'Construct symbolic reasoning involving series, polar or parametric functions, derivatives, or integrals.')]
    },
    {
      id: 'apstats', name: 'AP Statistics', short: 'AP Stats', emoji: '📊', category: 'Mathematics', color: '#fef8e1', slug: 'ap-statistics',
      exam: { mode: 'fully digital', duration: 180, mcq: { count: 42, minutes: 90, weight: 50 }, written: { count: 4, minutes: 90, weight: 50 }, note: 'The redesigned 2027 exam has four 10-point free-response questions, not six legacy FRQs.' },
      units: [
        unit('Unit 1: Exploring One-Variable Data', '15–23%', [['resistant statistic', 'The median and IQR resist extreme values better than the mean and standard deviation.'], ['standardized score', 'A z-score measures how many standard deviations an observation lies above or below the mean.']]),
        unit('Unit 2: Exploring Two-Variable Data', '5–7%', [['residual', 'A residual is observed minus predicted; a useful linear model leaves no systematic pattern in residuals.'], ['correlation limits', 'Correlation describes linear association, is not resistant, and does not establish causation.']]),
        unit('Unit 3: Collecting Data', '12–15%', [['random assignment', 'Random assignment supports causal conclusions by balancing lurking variables across treatments.'], ['random sampling', 'Random sampling supports generalization to the population from which the sample was drawn.']]),
        unit('Unit 4: Probability and Random Variables', '10–20%', [['conditional probability', 'Conditional probability restricts the sample space to the given condition.'], ['expected value', 'Expected value is the long-run mean of a random variable, not necessarily a possible single outcome.']]),
        unit('Unit 5: Sampling Distributions', '7–12%', [['sampling variability', 'A statistic varies from sample to sample; its sampling distribution describes that repeated-sampling behavior.'], ['central limit effect', 'With suitable conditions, a standardized sample statistic becomes approximately normal as sample size grows.']])
      ],
      tasks: [
        task('stats-practice12', 'Investigate and Interpret', 22, 10, COMMON.quantitative, 'Analyze a study or data display and communicate a conclusion in context.'),
        task('stats-practice34', 'Probability and Statistical Argument', 22, 10, COMMON.quantitative, 'Use probability or simulation to justify a statistical claim.'),
        task('stats-inference', 'Inference', 22, 10, ['Name the correct procedure.', 'Check random, independence, and distribution conditions.', 'Compute or interpret the interval or test.', 'Conclude in context with the correct parameter.'], 'Carry out and interpret a confidence interval or significance test.'),
        task('stats-multi', 'Multi-Concept Investigation', 22, 10, COMMON.quantitative, 'Connect data collection, modeling, probability, and inference in one investigation.')
      ]
    },
    {
      id: 'apbio', name: 'AP Biology', short: 'AP Bio', emoji: '🧬', category: 'Science', color: '#e8f5ee', slug: 'ap-biology',
      exam: { mode: 'hybrid digital', duration: 180, mcq: { count: 60, minutes: 90, weight: 50 }, written: { count: 6, minutes: 90, weight: 50 }, note: 'The free-response section contains two long and four short questions.' },
      units: [
        unit('Unit 1: Chemistry of Life', '8–11%', [['protein structure', 'A protein’s amino-acid sequence drives folding and interactions that determine function.'], ['water properties', 'Hydrogen bonding gives water cohesion, high heat capacity, and solvent behavior important to living systems.']]),
        unit('Unit 2: Cell Structure and Function', '10–13%', [['surface-area ratio', 'Smaller cells maintain a larger surface-area-to-volume ratio, improving exchange with the environment.'], ['membrane transport', 'Movement depends on concentration or electrochemical gradients, membrane permeability, and transport proteins.']]),
        unit('Unit 3: Cellular Energetics', '12–16%', [['enzyme regulation', 'Temperature, pH, substrate concentration, and inhibitors affect enzyme activity by altering collisions or protein shape.'], ['chemiosmosis', 'An electron transport chain builds a proton gradient whose diffusion through ATP synthase powers phosphorylation.']]),
        unit('Unit 4: Cell Communication and Cell Cycle', '10–15%', [['signal transduction', 'A ligand-receptor interaction initiates a pathway that can amplify a signal and change cell activity.'], ['cell-cycle control', 'Checkpoints regulate progression; failed control can permit damaged cells to divide.']]),
        unit('Unit 5: Heredity', '8–11%', [['independent assortment', 'Alleles of genes on different chromosomes assort independently; linkage can violate that expectation.'], ['meiotic variation', 'Crossing over, independent assortment, and random fertilization generate genetic variation.']]),
        unit('Unit 6: Gene Expression and Regulation', '12–16%', [['gene regulation', 'Cells with the same genome can differ because regulatory mechanisms change which genes are expressed.'], ['mutation effect', 'A mutation’s effect depends on location, codon change, reading frame, and influence on protein expression or function.']]),
        unit('Unit 7: Natural Selection', '13–20%', [['selection mechanism', 'Natural selection changes allele frequencies when heritable variants affect survival or reproduction.'], ['Hardy-Weinberg model', 'The model predicts stable allele frequencies only under its assumptions and provides a null expectation for comparison.']]),
        unit('Unit 8: Ecology', '10–15%', [['energy transfer', 'Energy decreases across trophic levels because organisms use and dissipate much of it as heat.'], ['population regulation', 'Density-dependent factors strengthen with population density, while density-independent events act regardless of density.']])
      ],
      tasks: [task('bio-long', 'Long FRQ', 25, 10, COMMON.science, 'Analyze an investigation, model, or multi-part biological scenario.'), task('bio-short', 'Short FRQ', 10, 4, COMMON.science, 'Answer a focused experimental, data-analysis, or conceptual biology prompt.')]
    },
    {
      id: 'apchem', name: 'AP Chemistry', short: 'AP Chem', emoji: '⚗️', category: 'Science', color: '#e8f5ee', slug: 'ap-chemistry',
      exam: { mode: 'hybrid digital', duration: 195, mcq: { count: 60, minutes: 90, weight: 50 }, written: { count: 7, minutes: 105, weight: 50 }, note: 'The free-response section contains three 10-point long questions and four 4-point short questions.' },
      units: [
        unit('Unit 1: Atomic Structure and Properties', '7–9%', [['photoelectron spectrum', 'Peak position reflects electron binding energy while relative peak area reflects the number of electrons in a subshell.'], ['periodic trend cause', 'Effective nuclear charge and occupied energy levels explain trends more reliably than memorized arrows alone.']]),
        unit('Unit 2: Molecular and Ionic Compound Structure', '7–9%', [['formal charge', 'Formal charge compares assigned valence electrons with the neutral atom and helps evaluate Lewis structures.'], ['lattice energy', 'Greater ionic charge and smaller ion distance generally produce stronger electrostatic attraction and larger lattice energy.']]),
        unit('Unit 3: Intermolecular Forces and Properties', '18–22%', [['intermolecular force', 'Particle polarity, polarizability, and hydrogen-bonding sites determine attractions and observable properties.'], ['Beer-Lambert relationship', 'Absorbance is proportional to concentration and path length within the useful linear range.']]),
        unit('Unit 4: Chemical Reactions', '7–9%', [['net ionic equation', 'Spectator ions are removed while atoms and charge remain balanced.'], ['stoichiometric limiting reactant', 'The limiting reactant is consumed first according to mole ratios and determines maximum product.']]),
        unit('Unit 5: Kinetics', '7–9%', [['rate law evidence', 'Reaction orders are determined experimentally by comparing initial rates, not inferred from overall equation coefficients.'], ['activation energy', 'A catalyst provides a lower-energy pathway but does not change reaction thermodynamics or equilibrium position.']]),
        unit('Unit 6: Thermodynamics', '7–9%', [['enthalpy accounting', 'Hess’s law works because enthalpy is a state function; reverse or scale equations and enthalpies together.'], ['calorimetry', 'Heat gained and lost sum to zero in an insulated model, with q=mcΔT for temperature change.']]),
        unit('Unit 7: Equilibrium', '7–9%', [['reaction quotient', 'Comparing Q with K predicts the direction of shift before equilibrium is restored.'], ['Le Châtelier reasoning', 'A stress changes concentrations or pressure, but only temperature changes the equilibrium constant.']]),
        unit('Unit 8: Acids and Bases', '11–15%', [['buffer mechanism', 'A weak acid/base conjugate pair consumes added strong base or acid, limiting pH change.'], ['titration equivalence', 'At equivalence, stoichiometric moles have reacted; the pH depends on the resulting species, not automatically seven.']]),
        unit('Unit 9: Applications of Thermodynamics', '7–9%', [['free energy', 'ΔG=ΔH−TΔS predicts thermodynamic favorability under stated conditions, not reaction speed.'], ['electrochemical potential', 'A positive standard cell potential corresponds to a negative standard Gibbs energy for the galvanic reaction.']])
      ],
      tasks: [task('chem-long', 'Long FRQ', 25, 10, COMMON.science, 'Solve a multi-part equilibrium, kinetics, thermodynamics, or laboratory investigation.'), task('chem-short', 'Short FRQ', 10, 4, COMMON.science, 'Explain a particle-level claim, calculation, or experimental result.')]
    },
    {
      id: 'apphys1', name: 'AP Physics 1', short: 'AP Physics 1', emoji: '⚛️', category: 'Science', color: '#e8f5ee', slug: 'ap-physics-1-algebra-based',
      exam: { mode: 'hybrid digital', duration: 180, mcq: { count: 42, minutes: 85, weight: 50 }, written: { count: 4, minutes: 95, weight: 50 }, note: 'The current exam has four task-specific FRQs: mathematical routines, representations, experiment design, and qualitative/quantitative translation.' },
      units: [
        unit('Unit 1: Kinematics', '10–15%', [['motion graph slope', 'Slope and area have different meanings: position slope is velocity, velocity slope is acceleration, and velocity area is displacement.'], ['reference frame', 'Position, velocity, and signs depend on the chosen origin and positive direction.']]),
        unit('Unit 2: Force and Translational Dynamics', '18–23%', [['system boundary', 'Only forces external to the chosen system appear in the system’s net-force equation.'], ['Newton’s third law', 'Interaction forces act on different objects, have equal magnitude and opposite direction, and therefore do not cancel on one object.']]),
        unit('Unit 3: Work, Energy, and Power', '18–23%', [['energy accounting', 'Energy transfers across a system boundary by work or other mechanisms; internal transformations do not create energy.'], ['potential energy graph', 'Force equals the negative slope of potential energy versus position and stable equilibrium occurs at a local minimum.']]),
        unit('Unit 4: Linear Momentum', '10–15%', [['impulse', 'Impulse equals change in momentum and is the area under a force-time graph.'], ['momentum system', 'Momentum is conserved when net external impulse on the selected system is negligible.']]),
        unit('Unit 5: Torque and Rotational Dynamics', '10–15%', [['torque lever arm', 'Torque magnitude depends on force times perpendicular lever arm, not simply distance to the pivot.'], ['rotational inertia', 'Rotational inertia depends on how mass is distributed relative to the axis.']]),
        unit('Unit 6: Energy and Momentum of Rotating Systems', '5–8%', [['rolling constraint', 'For rolling without slipping, translational speed and angular speed satisfy v=ωR.'], ['angular momentum', 'Angular momentum is conserved when net external torque is negligible.']]),
        unit('Unit 7: Oscillations', '5–8%', [['restoring force', 'Simple harmonic motion requires a restoring force proportional and opposite to displacement.'], ['oscillator energy', 'Ideal oscillator energy shifts between kinetic and potential while total mechanical energy remains constant.']]),
        unit('Unit 8: Fluids', '10–15%', [['continuity of flow', 'For steady incompressible flow, a smaller cross-sectional area corresponds to greater flow speed.'], ['buoyant force', 'Buoyant force equals the weight of displaced fluid, whether the object floats or is submerged.']])
      ],
      tasks: [task('physics-math', 'Mathematical Routines', 23, 12, COMMON.quantitative, 'Derive or calculate a relationship from a physical scenario.'), task('physics-represent', 'Translation Between Representations', 23, 12, COMMON.science, 'Connect words, diagrams, graphs, equations, and physical meaning.'), task('physics-experiment', 'Experimental Design and Analysis', 25, 12, COMMON.science, 'Design a procedure, identify measured quantities, and explain analysis.'), task('physics-qqt', 'Qualitative/Quantitative Translation', 23, 12, COMMON.science, 'Predict a change qualitatively and support it with quantitative reasoning.')]
    },
    {
      id: 'apenvs', name: 'AP Environmental Science', short: 'AP Environmental Science', emoji: '🌍', category: 'Science', color: '#e8f5ee', slug: 'ap-environmental-science',
      exam: { mode: 'fully digital', duration: 160, mcq: { count: 80, minutes: 90, weight: 60 }, written: { count: 3, minutes: 70, weight: 40 }, note: 'FRQs separately assess investigation design, quantitative-data analysis, and environmental calculations.' },
      units: [
        unit('Unit 1: The Living World—Ecosystems', '6–8%', [['productivity', 'Gross primary productivity minus producer respiration equals net primary productivity available to consumers.'], ['biogeochemical cycle', 'Matter cycles among reservoirs while energy flows and is dissipated rather than recycled.']]),
        unit('Unit 2: Biodiversity', '6–8%', [['island biogeography', 'Species richness reflects immigration and extinction rates shaped by island size and isolation.'], ['ecosystem resilience', 'Genetic and species diversity can provide functional redundancy that helps systems recover from disturbance.']]),
        unit('Unit 3: Populations', '10–15%', [['population growth model', 'Exponential growth assumes unlimited resources; logistic growth slows near carrying capacity.'], ['survivorship strategy', 'Life-history traits reflect tradeoffs in offspring number, parental care, and survival.']]),
        unit('Unit 4: Earth Systems and Resources', '10–15%', [['soil horizon process', 'Weathering, organic inputs, leaching, and deposition form distinct soil layers and influence fertility.'], ['atmospheric circulation', 'Uneven solar heating and Earth’s rotation drive global circulation and predictable climate zones.']]),
        unit('Unit 5: Land and Water Use', '10–15%', [['tragedy of commons', 'Open-access resources can be overused when individual incentives conflict with long-term collective benefit.'], ['integrated pest management', 'IPM combines monitoring, biological and cultural controls, and limited targeted chemical use.']]),
        unit('Unit 6: Energy Resources and Consumption', '10–15%', [['energy efficiency', 'Efficiency compares useful output with total input and conservation reduces total demand.'], ['energy externality', 'Market prices may omit health, climate, habitat, or waste costs borne by others.']]),
        unit('Unit 7: Atmospheric Pollution', '7–10%', [['photochemical smog', 'Sunlight drives reactions involving nitrogen oxides and volatile organic compounds that form ground-level ozone.'], ['temperature inversion', 'A warm air layer above cooler surface air suppresses vertical mixing and traps pollutants.']]),
        unit('Unit 8: Aquatic and Terrestrial Pollution', '7–10%', [['eutrophication', 'Excess nutrients fuel algal growth; decomposition then consumes dissolved oxygen and can cause hypoxia.'], ['biomagnification', 'Persistent fat-soluble contaminants become more concentrated at higher trophic levels.']]),
        unit('Unit 9: Global Change', '15–20%', [['radiative forcing', 'Greenhouse gases absorb outgoing infrared radiation and alter Earth’s energy balance.'], ['ocean acidification', 'Dissolved carbon dioxide forms carbonic acid, lowering pH and reducing carbonate availability.']])
      ],
      tasks: [task('env-investigation', 'Design an Investigation', 23, 10, COMMON.science, 'Design and evaluate an investigation in an environmental scenario.'), task('env-data', 'Quantitative Data Analysis', 23, 10, COMMON.science, 'Interpret a table, chart, or graph and propose a justified solution.'), task('env-calc', 'Environmental Problem with Calculations', 23, 10, COMMON.quantitative, 'Calculate an environmental quantity, interpret it, and justify a solution.')]
    },
    {
      id: 'apush', name: 'AP United States History', short: 'APUSH', emoji: '🇺🇸', category: 'History', color: '#fdf0e8', slug: 'ap-united-states-history', historyRange: '1491–2001',
      exam: { mode: 'fully digital', duration: 195, mcq: { count: 55, minutes: 55, weight: 40 }, written: { count: 5, minutes: 140, weight: 60 }, note: 'Written work includes three SAQs, one seven-document DBQ, and one LEQ.' },
      units: historyUnits('APUSH', [['Indigenous societies and European contact', 'Different environments shaped diverse Indigenous economies and political systems before sustained European contact.'], ['Colonial regional development', 'Labor systems, religion, geography, and imperial policy produced distinct British colonial regions.'], ['Revolution and new republic', 'Imperial conflict and republican ideas drove independence while exposing tensions over representation and slavery.'], ['Expansion and reform', 'Market growth, territorial expansion, forced removal, and reform reshaped antebellum society.'], ['Civil War and Reconstruction', 'Slavery and sectional power caused secession; Reconstruction transformed citizenship but faced violent resistance.'], ['Industrialization and migration', 'Corporate growth, urbanization, immigration, and labor conflict altered the late nineteenth-century economy.'], ['Progressivism and global power', 'Reformers used government to address industrial problems as the United States expanded overseas.'], ['Depression, war, and Cold War', 'Federal power expanded during crisis, while global conflict and containment reshaped politics and society.'], ['Post-1980 United States', 'Conservative politics, globalization, technology, and demographic change reorganized public life.']]),
      tasks: historyTasks()
    },
    {
      id: 'apworld', name: 'AP World History: Modern', short: 'AP World', emoji: '🌎', category: 'History', color: '#fdf0e8', slug: 'ap-world-history-modern', historyRange: '1200–present',
      exam: { mode: 'fully digital', duration: 195, mcq: { count: 55, minutes: 55, weight: 40 }, written: { count: 5, minutes: 140, weight: 60 }, note: 'Written work includes three SAQs, one seven-document DBQ, and one LEQ.' },
      units: historyUnits('World', [['State building c.1200–1450', 'States consolidated rule through religion, bureaucracy, military power, and tribute across regional systems.'], ['Exchange networks', 'Silk Roads, Indian Ocean routes, and trans-Saharan trade moved goods, technologies, religions, and disease.'], ['Land-based empires', 'Gunpowder, administration, and legitimizing traditions supported expansion while diversity created governance challenges.'], ['Transoceanic interconnections', 'Maritime empires linked hemispheres through coercive labor, ecological exchange, and commercial capitalism.'], ['Revolutions', 'Enlightenment ideas, fiscal crises, nationalism, and industrialization transformed states and social orders.'], ['Consequences of industrialization', 'Industrial states sought resources and markets, producing imperial rule, migration, resistance, and uneven development.'], ['Global conflict', 'Total war, economic crisis, fascism, and anticolonial nationalism destabilized the early twentieth century.'], ['Cold War and decolonization', 'New states navigated superpower rivalry, development strategies, and conflicts over borders and identity.'], ['Globalization', 'Trade, migration, communication, and environmental change increased interdependence and provoked new resistance.']]),
      tasks: historyTasks()
    },
    {
      id: 'apeuro', name: 'AP European History', short: 'AP Euro', emoji: '🏰', category: 'History', color: '#fdf0e8', slug: 'ap-european-history', historyRange: '1450–present',
      exam: { mode: 'fully digital', duration: 195, mcq: { count: 55, minutes: 55, weight: 40 }, written: { count: 5, minutes: 140, weight: 60 }, note: 'Written work includes three SAQs, one seven-document DBQ, and one LEQ.' },
      units: historyUnits('Europe', [['Renaissance and exploration', 'Humanism, state rivalry, and commercial expansion reshaped culture and connected Europe to Atlantic systems.'], ['Reformation', 'Religious fragmentation challenged authority and produced confessional states, conflict, and new social discipline.'], ['Absolutism and constitutionalism', 'European rulers built fiscal-military states through contrasting balances of monarchy, estates, and law.'], ['Scientific and intellectual change', 'Scientific methods and Enlightenment criticism challenged inherited authority and promoted reform.'], ['Revolution and Napoleon', 'Political and social revolution dismantled privilege, spread nationalism, and provoked restoration.'], ['Industrialization and its effects', 'Mechanized production, urbanization, class formation, and reform transformed economies and daily life.'], ['Nineteenth-century state building', 'Nationalism, liberalism, conservatism, and imperialism reorganized Europe and overseas empires.'], ['Twentieth-century crises', 'World wars, revolution, fascism, genocide, and depression shattered the European order.'], ['Cold War and contemporary Europe', 'Division, decolonization, integration, migration, and globalization reshaped postwar Europe.']]),
      tasks: historyTasks()
    },
    {
      id: 'apgov', name: 'AP United States Government and Politics', short: 'AP Gov', emoji: '🏛️', category: 'Social Science', color: '#fce8e8', slug: 'ap-united-states-government-and-politics',
      exam: { mode: 'fully digital', duration: 180, mcq: { count: 55, minutes: 80, weight: 50 }, written: { count: 4, minutes: 100, weight: 50 }, note: 'FRQs are concept application, quantitative analysis, SCOTUS comparison, and argument essay.' },
      units: [
        unit('Unit 1: Foundations of American Democracy', '15–22%', [['federalism', 'Constitutional authority is divided between national and state governments, and the balance changes through law, grants, and politics.'], ['separation of powers', 'Distinct institutions share and check powers, creating both restraint and opportunities for strategic action.']]),
        unit('Unit 2: Interactions Among Branches', '25–36%', [['congressional oversight', 'Congress monitors administration through hearings, investigations, appropriations, and confirmation-related leverage.'], ['bureaucratic discretion', 'Agencies translate broad statutes into rules and enforcement choices within legal and political constraints.']]),
        unit('Unit 3: Civil Liberties and Civil Rights', '13–18%', [['selective incorporation', 'The Supreme Court has applied many Bill of Rights protections to states through the Fourteenth Amendment.'], ['equal protection', 'Equal Protection doctrine evaluates government classifications under different levels of judicial scrutiny.']]),
        unit('Unit 4: American Political Ideologies and Beliefs', '10–15%', [['political socialization', 'Family, school, peers, media, and major events shape political attitudes over time.'], ['public opinion measurement', 'Wording, sampling frame, random selection, and margin of error affect what a poll can support.']]),
        unit('Unit 5: Political Participation', '20–27%', [['linkage institution', 'Parties, elections, interest groups, and media connect people to government and aggregate political demands.'], ['campaign strategy', 'Electoral rules, coalition targets, fundraising, and media environments shape candidate behavior.']])
      ],
      tasks: [task('gov-concept', 'Concept Application', 20, 3, COMMON.history, 'Apply a political institution, behavior, or process to a new scenario.'), task('gov-data', 'Quantitative Analysis', 20, 4, COMMON.quantitative, 'Interpret political data and draw a supported conclusion.'), task('gov-scotus', 'SCOTUS Comparison', 20, 4, COMMON.history, 'Compare a described case with a required Supreme Court case.'), task('gov-argument', 'Argument Essay', 40, 6, COMMON.essay, 'Develop a constitutional or political argument using required evidence.')]
    },
    {
      id: 'aphug', name: 'AP Human Geography', short: 'AP Human Geography', emoji: '🗺️', category: 'Social Science', color: '#fce8e8', slug: 'ap-human-geography',
      exam: { mode: 'fully digital', duration: 135, mcq: { count: 60, minutes: 60, weight: 50 }, written: { count: 3, minutes: 75, weight: 50 }, note: 'All FRQs use authentic geographic situations; later questions add one or two visual/data stimuli.' },
      units: [
        unit('Unit 1: Thinking Geographically', '8–10%', [['scale of analysis', 'A pattern visible nationally may differ at regional or local scales, so conclusions must match the scale of the data.'], ['spatial diffusion', 'Ideas, people, and innovations spread through relocation, contagious, hierarchical, or stimulus diffusion.']]),
        unit('Unit 2: Population and Migration', '12–17%', [['demographic transition', 'Birth and death rates change with development, producing characteristic population-growth stages.'], ['migration push-pull', 'Economic, political, social, and environmental factors interact with barriers and networks to shape migration.']]),
        unit('Unit 3: Cultural Patterns and Processes', '12–17%', [['cultural landscape', 'Built environments reflect values, power, identity, adaptation, and historical layering.'], ['language diffusion', 'Migration, conquest, trade, institutions, and media spread languages and create dialect patterns.']]),
        unit('Unit 4: Political Patterns and Processes', '12–17%', [['territoriality', 'Political groups assert control over space through boundaries, sovereignty, and administrative organization.'], ['centripetal and centrifugal forces', 'Shared institutions can unify a state while inequality, separatism, or conflict can fragment it.']]),
        unit('Unit 5: Agriculture and Rural Land Use', '12–17%', [['agricultural location', 'Perishability, transportation cost, land rent, labor, and market access influence agricultural patterns.'], ['agricultural transition', 'Commercialization and technology change farm size, labor, yields, diets, and environmental effects.']]),
        unit('Unit 6: Cities and Urban Land Use', '17–22%', [['urban model', 'Urban models simplify patterns of land use and must be applied with attention to historical and regional context.'], ['gentrification', 'Investment can improve infrastructure while raising costs and displacing lower-income residents.']]),
        unit('Unit 7: Industrial and Economic Development', '17–22%', [['development measure', 'Composite measures reveal different dimensions of well-being and can hide internal inequality.'], ['global production network', 'Firms locate stages of production based on labor, infrastructure, markets, policy, and transport costs.']])
      ],
      tasks: [task('hug-text', 'Text-Only Geographic FRQ', 25, 7, COMMON.history, 'Explain geographic patterns and processes in an authentic scenario.'), task('hug-stimulus', 'Single-Stimulus FRQ', 25, 7, COMMON.science, 'Interpret a map, image, or dataset and apply geographic concepts.'), task('hug-multi', 'Two-Stimulus and Scale FRQ', 25, 7, COMMON.science, 'Synthesize two stimuli and explain a spatial relationship across scales.')]
    },
    {
      id: 'appsych', name: 'AP Psychology', short: 'AP Psychology', emoji: '🧠', category: 'Social Science', color: '#fce8e8', slug: 'ap-psychology',
      exam: { mode: 'fully digital', duration: 160, mcq: { count: 75, minutes: 90, weight: 67 }, written: { count: 2, minutes: 70, weight: 33 }, note: 'The redesigned free-response section uses an Article Analysis Question and an Evidence-Based Question.' },
      units: [
        unit('Unit 1: Biological Bases of Behavior', '15–25%', [['neural communication', 'Neurons transmit electrical signals internally and chemical signals across synapses.'], ['brain plasticity', 'Experience and injury can reorganize neural connections, although recovery depends on age, location, and extent.']]),
        unit('Unit 2: Cognition', '15–25%', [['working memory', 'Working memory actively holds and manipulates limited information rather than storing it indefinitely.'], ['heuristic bias', 'Efficient mental shortcuts can produce systematic errors when salient or familiar information substitutes for probability.']]),
        unit('Unit 3: Development and Learning', '15–25%', [['operant conditioning', 'Consequences change future behavior: reinforcement increases it and punishment decreases it.'], ['development interaction', 'Development reflects interacting biological maturation, environment, culture, and individual experience.']]),
        unit('Unit 4: Social Psychology and Personality', '15–25%', [['attribution', 'People explain behavior using dispositional or situational causes and may overemphasize disposition for others.'], ['social influence', 'Conformity, compliance, and obedience depend on group norms, authority, unanimity, and context.']]),
        unit('Unit 5: Mental and Physical Health', '15–25%', [['diagnostic reliability', 'Reliability concerns consistency of diagnosis, while validity concerns whether the diagnosis captures the intended condition.'], ['treatment evidence', 'Treatment claims require comparison conditions, operational measures, and attention to random assignment and confounds.']])
      ],
      tasks: [task('psych-aaq', 'Article Analysis Question (AAQ)', 35, 7, ['Identify the research method and operational variables.', 'Interpret the reported statistic or result.', 'Evaluate ethics, generalizability, or design limits.', 'Apply a psychological concept to the findings.'], 'Analyze the design, results, and limitations of a behavioral research article.'), task('psych-ebq', 'Evidence-Based Question (EBQ)', 35, 7, ['Make a defensible claim.', 'Use evidence from at least two supplied sources.', 'Explain how each source supports the claim with psychological reasoning.', 'Address a relevant qualification or alternative.'], 'Develop a psychological argument using a short packet of research evidence.')]
    },
    {
      id: 'apmacro', name: 'AP Macroeconomics', short: 'AP Macro', emoji: '💹', category: 'Social Science', color: '#fce8e8', slug: 'ap-macroeconomics',
      exam: { mode: 'hybrid digital', duration: 130, mcq: { count: 60, minutes: 70, weight: 66 }, written: { count: 3, minutes: 60, weight: 34 }, note: 'One long FRQ is half of the written score; two short FRQs are one quarter each.' },
      units: [
        unit('Unit 1: Basic Economic Concepts', '5–10%', [['opportunity cost', 'The opportunity cost of a choice is the value of the next best alternative forgone.'], ['comparative advantage', 'Comparative advantage depends on lower opportunity cost and supports mutually beneficial specialization.']]),
        unit('Unit 2: Economic Indicators and the Business Cycle', '12–17%', [['real GDP', 'Real GDP adjusts nominal production for price-level changes and measures final domestic output.'], ['unemployment limits', 'The unemployment rate excludes people outside the labor force and does not capture underemployment.']]),
        unit('Unit 3: National Income and Price Determination', '17–27%', [['aggregate demand shift', 'Changes in consumption, investment, government purchases, or net exports shift aggregate demand.'], ['short-run aggregate supply', 'Input costs, expected inflation, productivity, and supply shocks shift short-run aggregate supply.']]),
        unit('Unit 4: Financial Sector', '18–23%', [['money market', 'Money demand and money supply determine the nominal interest rate in the money-market model.'], ['bank balance sheet', 'Loans are bank assets, deposits are liabilities, and reserves support withdrawals and regulatory requirements.']]),
        unit('Unit 5: Long-Run Consequences of Stabilization Policies', '20–30%', [['crowding out', 'Expansionary fiscal borrowing can raise real interest rates and reduce private investment.'], ['long-run adjustment', 'Wages and input prices adjust so output returns to potential, while the price level may change.']]),
        unit('Unit 6: Open Economy—International Trade and Finance', '10–13%', [['foreign exchange demand', 'Demand for a currency arises when foreigners buy that country’s goods, services, or financial assets.'], ['capital flow identity', 'Net capital inflow and the current account are linked through international payments and saving-investment balances.']])
      ],
      tasks: [task('macro-long', 'Long FRQ', 30, 10, COMMON.quantitative, 'Connect multiple macroeconomic models, policy actions, and graph changes.'), task('macro-short', 'Short FRQ', 15, 5, COMMON.quantitative, 'Analyze a focused macroeconomic change using a graph, calculation, or explanation.')]
    },
    {
      id: 'aplang', name: 'AP English Language and Composition', short: 'AP Lang', emoji: '📝', category: 'English', color: '#e8eef8', slug: 'ap-english-language-and-composition',
      exam: { mode: 'fully digital', duration: 195, mcq: { count: 45, minutes: 60, weight: 45 }, written: { count: 3, minutes: 135, weight: 55 }, note: 'MCQs split between reading and writing; essays are synthesis, rhetorical analysis, and argument.' },
      units: [
        unit('Unit 1: Rhetorical Situation', 'course foundation', [['rhetorical situation', 'Purpose, audience, exigence, context, and speaker shape the choices a writer makes.'], ['line of reasoning', 'A line of reasoning connects claims and evidence so each paragraph advances the central argument.']]),
        unit('Unit 2: Claims and Evidence', 'recurs across units', [['defensible claim', 'A defensible claim is specific, contestable, and supportable with relevant evidence.'], ['evidence commentary', 'Commentary explains how evidence supports a claim rather than merely restating or naming it.']]),
        unit('Unit 3: Organization and Style', 'recurs across units', [['qualification', 'A qualification limits a claim to preserve accuracy and can strengthen rather than weaken an argument.'], ['rhetorical choice', 'Syntax, diction, figurative language, structure, and selection of detail create effects in context.']]),
        unit('Unit 4: Source-Based Argument', 'synthesis emphasis', [['source conversation', 'Strong synthesis puts sources in relation to one another instead of summarizing them one at a time.'], ['citation function', 'A source earns value when its evidence is accurately represented and connected to the writer’s reasoning.']])
      ],
      tasks: [task('lang-synthesis', 'Synthesis Essay', 55, 6, COMMON.essay, 'Use at least three supplied sources to develop an argument.'), task('lang-rhetorical', 'Rhetorical Analysis Essay', 40, 6, COMMON.essay, 'Analyze how a writer’s choices contribute to purpose or message.'), task('lang-argument', 'Argument Essay', 40, 6, COMMON.essay, 'Develop an evidence-based position on a conceptual issue.')]
    },
    {
      id: 'aplit', name: 'AP English Literature and Composition', short: 'AP Lit', emoji: '📖', category: 'English', color: '#e8eef8', slug: 'ap-english-literature-and-composition',
      exam: { mode: 'fully digital', duration: 180, mcq: { count: 55, minutes: 60, weight: 45 }, written: { count: 3, minutes: 120, weight: 55 }, note: 'Five MCQ passage sets include prose/drama and poetry; essays cover poetry, prose fiction, and literary argument.' },
      units: [
        unit('Short Fiction Analysis', 'course strand', [['narrative perspective', 'Narrator position, reliability, and distance control what readers know and how they judge events.'], ['character complexity', 'Contradictory motives, changes, and relationships build a character’s complexity and thematic function.']]),
        unit('Poetry Analysis', 'course strand', [['speaker and situation', 'The speaker is a constructed voice whose situation and shifts guide interpretation.'], ['figurative pattern', 'Repeated images, comparisons, sound, and syntax build relationships that support an interpretation.']]),
        unit('Long Fiction and Drama', 'course strand', [['structure', 'Sequence, pacing, contrast, and placement of revelations shape meaning across a work.'], ['symbol and motif', 'A recurring element gains interpretive value through its changing contexts, not by a fixed universal definition.']]),
        unit('Literary Argument', 'exam synthesis', [['interpretive thesis', 'A strong thesis makes a specific interpretation about how a literary element contributes to the work’s meaning.'], ['evidence reasoning', 'Details become evidence only when the response explains their relationship to the interpretation.']])
      ],
      tasks: [task('lit-poetry', 'Poetry Analysis', 40, 6, COMMON.essay, 'Interpret a poem and analyze how poetic choices support that interpretation.'), task('lit-prose', 'Prose Fiction Analysis', 40, 6, COMMON.essay, 'Interpret a prose passage and analyze narrative or stylistic choices.'), task('lit-argument', 'Literary Argument', 40, 6, COMMON.essay, 'Use a suitable work of fiction or drama to develop a literary argument.')]
    },
    {
      id: 'apspan', name: 'AP Spanish Language and Culture', short: 'AP Spanish', emoji: '🇪🇸', category: 'Languages', color: '#fef8e1', slug: 'ap-spanish-language-and-culture',
      exam: { mode: 'fully digital + project', duration: 150, mcq: { count: 55, minutes: 80, weight: 50 }, written: { count: 3, minutes: 69, weight: 50 }, note: 'For 2027, free response is a project presentation, project Q&A, and source-based argumentative essay; MCQ is listening plus reading.' },
      units: [
        unit('Families and Communities', 'course theme', [['cultural comparison', 'A strong comparison explains both similarity and difference using specific practices, products, and perspectives.'], ['interpersonal register', 'Greeting, tone, questions, transitions, and closing should fit the relationship and communicative purpose.']]),
        unit('Personal and Public Identities', 'course theme', [['identity perspective', 'Language, history, ethnicity, beliefs, and social roles interact to shape individual and collective identity.'], ['source inference', 'An inference must be supported by details in the audio or text rather than by a stereotype.']]),
        unit('Beauty and Aesthetics', 'course theme', [['artistic context', 'Interpretation connects a work’s form and purpose to its cultural and historical context.'], ['comparison transition', 'Connectors such as mientras que, sin embargo, and de manera semejante make relationships explicit.']]),
        unit('Science and Technology', 'course theme', [['argument synthesis', 'A source-based argument integrates print and audio evidence into a claim rather than listing source summaries.'], ['precise language', 'Circumlocution and context-specific vocabulary maintain communication when an exact word is unavailable.']]),
        unit('Contemporary Life', 'course theme', [['project evidence', 'A project presentation should explain what research established and why the findings matter, with source attribution.'], ['spontaneous response', 'In Q&A, answer the exact question first, then support it with a specific research detail.']]),
        unit('Global Challenges', 'course theme', [['stakeholder perspective', 'Global issues affect groups differently, so an argument should identify tradeoffs and perspectives.'], ['audio note-taking', 'Capture names, numbers, transitions, tone, and claims rather than trying to transcribe every word.']])
      ],
      tasks: [task('span-project', 'Project Presentation', 6, 5, ['Answer the project prompt directly.', 'Organize research findings coherently.', 'Use specific cultural evidence and attribute sources.', 'Maintain comprehensible, connected Spanish for three minutes.'], 'Prepare and deliver a three-minute research presentation in Spanish.'), task('span-qa', 'Project Q&A', 4, 5, ['Answer each question directly.', 'Use project research as support.', 'Sustain spontaneous comprehensible speech.', 'Use interpersonal transitions and clarification strategies.'], 'Respond to four unseen questions about project research in Spanish.'), task('span-essay', 'Argumentative Essay', 55, 5, ['State and sustain a position.', 'Integrate evidence from print and audio sources.', 'Explain relationships among sources and claims.', 'Use organized, comprehensible written Spanish.'], 'Write a source-based argumentative essay in Spanish.')]
    }
  ];

  function historyUnits(label, entries) {
    return entries.map(function (entry, i) {
      return unit('Unit ' + (i + 1) + ': ' + entry[0], i === 0 || i === entries.length - 1 ? '8–10%' : '10–17%', [
        [entry[0], entry[1], 'A date or name alone does not establish causation, comparison, or change over time.'],
        [label + ' historical reasoning ' + (i + 1), 'For ' + entry[0] + ', connect the specific development—' + entry[1].replace(/\.$/, '') + '—to a defensible claim about causation, comparison, or continuity and change.', 'Avoid treating chronology as proof; explain the mechanism linking evidence to the claim.']
      ]);
    });
  }

  function historyTasks() {
    return [
      task('history-saq', 'Short-Answer Question (SAQ)', 13, 3, COMMON.history, 'Answer three labeled parts with a direct claim, specific evidence, and explanation.'),
      task('history-dbq', 'Document-Based Question (DBQ)', 60, 7, ['Contextualize the prompt historically.', 'Present a defensible thesis and line of reasoning.', 'Use at least four documents as evidence.', 'Explain sourcing for at least two documents.', 'Use one piece of specific outside evidence.', 'Demonstrate complex understanding where supported.'], 'Use a seven-document packet to develop a historical argument.'),
      task('history-leq', 'Long-Essay Question (LEQ)', 40, 6, ['Contextualize the prompt historically.', 'Present a defensible thesis and line of reasoning.', 'Use at least two pieces of specific evidence.', 'Apply the requested historical reasoning.', 'Demonstrate complex understanding where supported.'], 'Develop an evidence-based historical argument without supplied documents.')
    ];
  }

  subjects.push(
    {
      id: 'apprecalc', name: 'AP Precalculus', short: 'AP Precalculus', emoji: '📈', category: 'Mathematics', color: '#f0e8ff', slug: 'ap-precalculus',
      exam: { mode: 'hybrid digital', duration: 175, mcq: { count: 42, minutes: 105, weight: 63 }, written: { count: 4, minutes: 70, weight: 37 }, note: 'Units 1–3 are assessed. Two MCQ/FRQ parts require a graphing calculator and two FRQs are calculator-free.' },
      units: [
        unit('Unit 1: Polynomial and Rational Functions', '30–40%', [['rate of change', 'Average rate uses secant slope over an interval while instantaneous behavior is inferred from local graph or model features.'], ['end behavior', 'Degree and leading coefficient determine polynomial end behavior; rational end behavior also depends on relative degrees.']]),
        unit('Unit 2: Exponential and Logarithmic Functions', '27–40%', [['multiplicative change', 'Exponential models have a constant ratio over equal input intervals, unlike linear models with constant difference.'], ['logarithmic inverse', 'A logarithm gives the exponent needed to produce a value and reverses an exponential function on its domain.']]),
        unit('Unit 3: Trigonometric and Polar Functions', '30–35%', [['periodic parameters', 'Amplitude, vertical shift, period, and phase shift connect a sinusoidal model to its context.'], ['polar representation', 'A polar point uses directed distance and angle, so multiple coordinate pairs can name the same point.']])
      ],
      tasks: [task('precalc-concepts', 'Function Concepts (Calculator)', 18, 6, COMMON.quantitative, 'Analyze function behavior across graphical, numerical, verbal, and symbolic representations.'), task('precalc-nonperiodic', 'Non-Periodic Modeling (Calculator)', 18, 6, COMMON.quantitative, 'Build and interpret a polynomial, rational, exponential, or logarithmic model.'), task('precalc-periodic', 'Periodic Modeling (No Calculator)', 17, 6, COMMON.quantitative, 'Build and interpret a trigonometric or polar model.'), task('precalc-symbolic', 'Symbolic Manipulations (No Calculator)', 17, 6, COMMON.quantitative, 'Transform expressions and justify conclusions about a function.')]
    },
    {
      id: 'apmicro', name: 'AP Microeconomics', short: 'AP Micro', emoji: '🏪', category: 'Social Science', color: '#fce8e8', slug: 'ap-microeconomics',
      exam: { mode: 'hybrid digital', duration: 130, mcq: { count: 60, minutes: 70, weight: 66 }, written: { count: 3, minutes: 60, weight: 34 }, note: 'One long FRQ is half of the written score; two short FRQs are one quarter each.' },
      units: [
        unit('Unit 1: Basic Economic Concepts', '12–15%', [['comparative advantage', 'The producer with lower opportunity cost has comparative advantage, even when another producer has absolute advantage.'], ['marginal analysis', 'An optimizing decision compares the additional benefit with the additional cost of the next unit.']]),
        unit('Unit 2: Supply and Demand', '20–25%', [['market equilibrium', 'Price adjusts shortages and surpluses toward the quantity where demand equals supply.'], ['elasticity', 'Elasticity measures responsiveness; total-revenue effects depend on whether demand is elastic or inelastic.']]),
        unit('Unit 3: Production, Cost, and Perfect Competition', '22–25%', [['marginal product and cost', 'Diminishing marginal product eventually raises marginal cost when other inputs are fixed.'], ['competitive output', 'A price-taking firm produces where price equals marginal cost when price covers average variable cost in the short run.']]),
        unit('Unit 4: Imperfect Competition', '15–22%', [['monopoly choice', 'A monopolist chooses quantity where marginal revenue equals marginal cost and then uses demand to set price.'], ['game theory', 'A dominant strategy is best regardless of the other player’s action; a Nash equilibrium is mutual best response.']]),
        unit('Unit 5: Factor Markets', '10–13%', [['marginal revenue product', 'A profit-maximizing firm hires an input until its marginal revenue product equals marginal factor cost.'], ['derived demand', 'Demand for labor or another input derives from demand for the output it helps produce.']]),
        unit('Unit 6: Market Failure and Government', '8–13%', [['externality correction', 'A per-unit tax or subsidy can align private incentives with marginal social cost or benefit.'], ['public good', 'Nonrivalry and nonexcludability create a free-rider problem and underprovision by private markets.']])
      ],
      tasks: [task('micro-long', 'Long FRQ', 30, 10, COMMON.quantitative, 'Connect firm, market, welfare, and policy changes across multiple graphs.'), task('micro-short', 'Short FRQ', 15, 5, COMMON.quantitative, 'Analyze a focused market or firm change with a graph, calculation, and explanation.')]
    },
    {
      id: 'apphyscmech', name: 'AP Physics C: Mechanics', short: 'AP Physics C: Mechanics', emoji: '🛰️', category: 'Science', color: '#e8f5ee', slug: 'ap-physics-c-mechanics',
      exam: { mode: 'hybrid digital', duration: 180, mcq: { count: 42, minutes: 85, weight: 50 }, written: { count: 4, minutes: 95, weight: 50 }, note: 'Calculus-based mechanics with four task-specific FRQs and calculator access.' },
      units: [
        unit('Unit 1: Kinematics', '10–15%', [['derivative motion relation', 'Velocity is the time derivative of position and acceleration is the time derivative of velocity.'], ['integral motion relation', 'Integrating velocity gives displacement and integrating acceleration gives change in velocity.']]),
        unit('Unit 2: Force and Translational Dynamics', '20–25%', [['differential equation of motion', 'Newton’s second law can produce a differential equation when force depends on position, velocity, or time.'], ['constraint force', 'A constraint links accelerations or coordinates and must be combined with force equations for the connected system.']]),
        unit('Unit 3: Work, Energy, and Power', '15–25%', [['work integral', 'Work by a variable force is the line integral of force along displacement.'], ['potential gradient', 'In one dimension force is the negative derivative of potential energy with respect to position.']]),
        unit('Unit 4: Linear Momentum', '10–20%', [['center of mass', 'The center of mass accelerates according to net external force divided by total mass.'], ['impulse integral', 'Impulse is the time integral of force and equals change in linear momentum.']]),
        unit('Unit 5: Torque and Rotational Dynamics', '15–25%', [['rotational equation', 'Net external torque about an axis equals the time rate of angular momentum and reduces to Iα for fixed rigid-body conditions.'], ['parallel-axis theorem', 'Moment of inertia about a parallel axis equals the center-of-mass value plus mass times axis separation squared.']]),
        unit('Unit 6: Energy and Momentum of Rotating Systems', '10–15%', [['angular impulse', 'The time integral of torque equals change in angular momentum.'], ['rolling energy', 'Rolling kinetic energy includes both center-of-mass translation and rotation about the center of mass.']]),
        unit('Unit 7: Oscillations', '10–15%', [['oscillator differential equation', 'A restoring force proportional to negative displacement produces sinusoidal simple harmonic motion.'], ['small-angle pendulum', 'The small-angle approximation linearizes pendulum motion and yields a period independent of amplitude in that limit.']])
      ],
      tasks: [task('physc-math', 'Mathematical Routines', 23, 12, COMMON.quantitative, 'Use calculus to derive or calculate a mechanics relationship.'), task('physc-represent', 'Translation Between Representations', 23, 12, COMMON.science, 'Connect a calculus-based model to graphs, diagrams, and physical meaning.'), task('physc-experiment', 'Experimental Design and Analysis', 25, 12, COMMON.science, 'Design measurements and analysis for a mechanics investigation.'), task('physc-qqt', 'Qualitative/Quantitative Translation', 23, 12, COMMON.science, 'Support a qualitative prediction with a calculus-based quantitative argument.')]
    },
    {
      id: 'apcompgov', name: 'AP Comparative Government and Politics', short: 'AP Comparative Gov', emoji: '🌐', category: 'Social Science', color: '#fce8e8', slug: 'ap-comparative-government-and-politics',
      exam: { mode: 'fully digital', duration: 150, mcq: { count: 55, minutes: 60, weight: 50 }, written: { count: 4, minutes: 90, weight: 50 }, note: 'Questions compare China, Iran, Mexico, Nigeria, Russia, and the United Kingdom.' },
      units: [
        unit('Unit 1: Political Systems, Regimes, and Governments', '18–27%', [['regime legitimacy', 'Regimes claim legitimacy through elections, tradition, ideology, performance, nationalism, or religion.'], ['state capacity', 'State capacity is the ability to formulate and implement policy, collect revenue, maintain order, and provide services.']]),
        unit('Unit 2: Political Institutions', '22–33%', [['executive-legislative relation', 'Presidential, parliamentary, and semi-presidential systems distribute selection and removal powers differently.'], ['judicial independence', 'Appointment rules, tenure, enforcement capacity, and political pressure shape whether courts can constrain other actors.']]),
        unit('Unit 3: Political Culture and Participation', '11–18%', [['political cleavage', 'Ethnic, religious, regional, class, and generational identities become politically important through institutions and mobilization.'], ['civil society', 'Organizations outside the state can represent interests, provide services, and demand accountability, subject to regime constraints.']]),
        unit('Unit 4: Party and Electoral Systems', '13–18%', [['electoral rule effect', 'Plurality and proportional systems create different incentives for parties, coalitions, representation, and strategic voting.'], ['party system', 'Dominant-party, two-party, and multiparty systems structure competition but do not alone determine regime type.']]),
        unit('Unit 5: Political and Economic Change', '16–24%', [['market reform', 'Liberalization and privatization can increase efficiency while creating distributional and legitimacy challenges.'], ['democratization', 'Transitions depend on institutions, elite bargains, social pressure, economic conditions, and international influences.']])
      ],
      tasks: [task('comp-concept', 'Conceptual Analysis', 20, 4, COMMON.history, 'Define and compare a political concept across course countries.'), task('comp-data', 'Quantitative Analysis', 20, 4, COMMON.quantitative, 'Interpret comparative political data and support a conclusion.'), task('comp-compare', 'Comparative Analysis', 20, 5, COMMON.history, 'Compare an institution, process, policy, or behavior in two course countries.'), task('comp-argument', 'Argument Essay', 30, 5, COMMON.essay, 'Develop a comparative political argument using specific country evidence.')]
    }
  );

  const scoreBands = {
    apcsp: [0, 37, 50, 63, 76], apcsa: [0, 36, 49, 62, 75], apcalcab: [0, 34, 48, 61, 73], apcalcbc: [0, 35, 49, 62, 74],
    apstats: [0, 34, 47, 60, 73], apbio: [0, 35, 48, 61, 74], apchem: [0, 34, 47, 60, 73], apphys1: [0, 35, 48, 61, 74],
    apenvs: [0, 37, 50, 63, 76], apush: [0, 37, 50, 63, 76], apworld: [0, 36, 49, 62, 75], apeuro: [0, 36, 49, 62, 75],
    apgov: [0, 39, 52, 65, 78], aphug: [0, 38, 51, 64, 77], appsych: [0, 39, 52, 65, 78], apmacro: [0, 37, 50, 63, 76],
    aplang: [0, 38, 51, 64, 77], aplit: [0, 37, 50, 63, 76], apspan: [0, 38, 51, 64, 77],
    apprecalc: [0, 37, 50, 63, 76], apmicro: [0, 37, 50, 63, 76], apphyscmech: [0, 35, 48, 61, 74], apcompgov: [0, 38, 51, 64, 77]
  };

  const patterns = {
    default: [
      ['Command-word lock', 'Circle the verb—identify, describe, explain, justify, calculate, evaluate—and make the response do exactly that job.', 'A correct fact can still miss the point if it does not satisfy the command word.'],
      ['Representation check', 'Translate every graph, table, diagram, quotation, or code segment into a one-sentence claim before evaluating options.', 'Do not choose an option merely because it repeats a visible label.'],
      ['Scope match', 'Match the answer’s scope to the evidence: local data cannot automatically prove a universal conclusion.', 'Absolute words such as always and proves require unusually strong support.'],
      ['Mechanism over label', 'Prefer the answer that explains how or why the result occurs, not one that only names the topic.', 'A vocabulary word without a causal or logical link is often a distractor.']
    ],
    History: [
      ['Source before recall', 'Identify author, audience, purpose, context, and claim before bringing in outside knowledge.', 'A historically true option can still be unsupported by the source.'],
      ['Period boundary', 'Check whether the evidence actually belongs inside the prompt’s dates and whether it demonstrates cause, effect, continuity, or change.', 'Near-period facts are common distractors.'],
      ['DBQ document jobs', 'Assign each document a job—context, claim support, qualification, or counterpoint—before drafting.', 'Seven summaries do not form an argument.']
    ],
    English: [
      ['Function, not device hunt', 'Ask what a choice accomplishes in this exact passage before naming the device.', 'A correct device label is insufficient if its claimed effect conflicts with context.'],
      ['Evidence proximity', 'For inference questions, return to the smallest relevant passage and demand textual support for every part of an option.', 'Broad thematic claims often outrun the excerpt.'],
      ['Line-of-reasoning map', 'Write a five-word job beside each paragraph—concede, define, exemplify, pivot, conclude.', 'Transitions reveal argumentative structure more reliably than topic words alone.']
    ],
    Mathematics: [
      ['Conditions before theorem', 'State the interval, continuity, differentiability, randomness, independence, or distribution condition before invoking a theorem.', 'Matching a formula is not enough when conditions fail.'],
      ['Unit and meaning check', 'Attach units and interpret sign, slope, area, rate, probability, or parameter in context.', 'A numerically correct value can represent the wrong quantity.'],
      ['Representation triangle', 'Connect the same idea in words, symbols, and a graph; use the representation that exposes the relationship fastest.', 'Calculator output needs mathematical justification when the prompt asks for reasoning.']
    ],
    Science: [
      ['Claim–evidence–mechanism', 'Build every explanation as claim, specific observation or data, then the course mechanism linking them.', 'Restating the data is not an explanation.'],
      ['Control the experiment', 'Identify the independent variable, dependent variable, comparison group, constants, and a measurable expected result.', 'More trials improve reliability but do not repair a confound.'],
      ['Proportional prediction', 'Before calculating, predict direction and relative size from the governing relationship.', 'A result that violates the qualitative prediction signals a setup or sign error.']
    ],
    'Social Science': [
      ['Operationalize the claim', 'Translate an abstract concept into the concrete measure, institution, behavior, or graph shown.', 'A related concept is not enough unless it explains the presented evidence.'],
      ['Causation guardrail', 'Ask whether assignment, comparison, timing, and alternative explanations support a causal claim.', 'Correlation, polling, or observational evidence alone usually cannot prove causation.'],
      ['Model shift sequence', 'Name the market, curve, direction, and resulting variables in order before evaluating policy effects.', 'Moving along a curve is different from shifting it.']
    ],
    'Computer Science': [
      ['Trace with a table', 'Record variable values, condition results, and collection indices after each executed step.', 'Do not mentally skip an iteration or assume a branch executes.'],
      ['Boundary first', 'Test empty, one-element, first-index, last-index, and just-outside cases before trusting an algorithm.', 'Most collection errors hide at boundaries or after mutation.'],
      ['Contract check', 'Separate preconditions, method behavior, state changes, and return value.', 'Code that produces the sample output may still violate the general contract.']
    ],
    Languages: [
      ['Purpose-first listening', 'Capture who is speaking, why, to whom, and what changes; then use details to discriminate options.', 'A repeated word can be a distractor when the speaker rejects or contrasts it.'],
      ['Evidence in Spanish', 'Answer first, cite a concrete detail, and explain its relevance using connected language.', 'Do not spend limited speaking time restating the prompt.'],
      ['Comparison architecture', 'Name both communities in each comparison point and connect practice or product to perspective.', 'Two separate descriptions are not yet a comparison.']
    ]
  };

  const baseDistractors = ['The evidence establishes an absolute conclusion without additional assumptions.', 'The observation is unrelated to the named course concept.', 'The result follows only because every variable in the situation is constant.'];

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function rotate(items, by) {
    const n = items.length;
    return items.map(function (_, i) { return items[(i + by) % n]; });
  }

  function buildStimulus(subject, concept, formIndex) {
    const lead = {
      History: 'Original practice source analysis: A historian evaluating ' + concept.unit.replace(/^Unit \d+: /, '') + ' advances this interpretation: ',
      Science: 'Original investigation brief: A research team observes a pattern best summarized as follows: ',
      Mathematics: 'Original model brief: A student translates among a graph, a table, and symbols and records this relationship: ',
      English: 'Original passage-analysis note: A writer’s choices create the following relationship in context: ',
      'Social Science': 'Original case-study brief: A dataset or institutional comparison supports this claim: ',
      'Computer Science': 'Original computing scenario: A program or network is designed around this principle: ',
      Languages: 'Situación auténtica de práctica: Un texto, audio o intercambio comunica esta relación: '
    }[subject.category] || 'Original course scenario: ';
    const focus = formIndex % 3 === 0 ? ' Evaluate its scope and limitations.' : formIndex % 3 === 1 ? ' Connect it to the named unit.' : ' Identify the reasoning that makes it defensible.';
    return lead + concept.teach + focus;
  }

  function generateQuestions(subject) {
    const concepts = [];
    subject.units.forEach(function (u, unitIndex) {
      u.concepts.forEach(function (c, conceptIndex) { concepts.push({ unit: u.name, unitIndex, conceptIndex, name: c.name, teach: c.teach, trap: c.trap }); });
    });
    const questions = [];
    concepts.forEach(function (c, i) {
      const others = [1, 2, 3].map(function (step) { return concepts[(i + step) % concepts.length]; });
      const forms = [
        { stem: 'Which statement best explains ' + c.name + '?', correct: c.teach, distractors: others.map(function (x) { return x.teach; }), skill: 'Concept explanation' },
        { stem: 'A student uses the following reasoning in ' + subject.short + ': “' + c.teach + '” Which concept most directly supports the reasoning?', correct: c.name, distractors: others.map(function (x) { return x.name; }), skill: 'Application' },
        { stem: 'Which revision would make a claim about ' + c.name + ' most accurate?', correct: c.teach, distractors: [c.trap].concat(others.slice(0, 2).map(function (x) { return x.teach; })), skill: 'Misconception repair' },
        { stem: 'Before using ' + c.name + ' to answer an exam question, which check is most important?', correct: c.trap.replace(/^Do not /, 'Check that you do not ').replace(/^Avoid /, 'Check that you avoid '), distractors: baseDistractors, skill: 'Reasoning check' },
        { stem: 'Which course connection correctly links ' + c.name + ' to ' + c.unit.replace(/^Unit \d+: /, '') + '?', correct: c.name + ': ' + c.teach, distractors: others.map(function (x) { return x.name + ': ' + x.teach; }), skill: 'Unit connection' },
        { stem: 'A student applies ' + c.name + ' too broadly. Which reminder best repairs the reasoning?', correct: c.name + ': ' + c.trap, distractors: others.map(function (x) { return x.name + ': ' + x.trap; }), skill: 'Boundary check' },
        { stem: 'Which term-and-meaning pair is accurate?', correct: c.name + ' — ' + c.teach, distractors: others.map(function (x) { return c.name + ' — ' + x.teach; }), skill: 'Precision' },
        { stem: 'In an unfamiliar stimulus, which claim would be the strongest defensible first step about ' + c.name + '?', correct: c.teach, distractors: rotate(others.map(function (x) { return x.teach; }), 1), skill: 'Transfer' },
        { stem: 'Which student note about ' + c.name + ' should be retained during a rapid review?', correct: c.teach, distractors: rotate(others.map(function (x) { return x.teach; }), 2), skill: 'Retrieval' },
        { stem: 'A prompt asks for reasoning rather than a label. Which explanation of ' + c.name + ' is precise enough to use?', correct: c.teach, distractors: [c.trap].concat(others.slice(1).map(function (x) { return x.teach; })), skill: 'Explanation' },
        { stem: 'Which statement preserves the correct scope of ' + c.name + '?', correct: c.teach, distractors: baseDistractors.slice().reverse(), skill: 'Scope' },
        { stem: 'A distractor names ' + others[0].name + '. What most clearly supports choosing ' + c.name + ' instead?', correct: c.teach, distractors: others.map(function (x) { return x.teach; }), skill: 'Discrimination' }
      ];
      forms.forEach(function (form, formIndex) {
        const answer = hash(subject.id + ':' + i + ':' + formIndex) % 4;
        let distractors = form.distractors.slice(0, 3);
        while (distractors.length < 3) distractors.push(baseDistractors[distractors.length]);
        const raw = distractors.slice(); raw.splice(answer, 0, form.correct);
        questions.push({
          id: subject.id + '-u' + (c.unitIndex + 1) + '-c' + (c.conceptIndex + 1) + '-f' + (formIndex + 1),
          subject: subject.id, unit: c.unit, unitIndex: c.unitIndex, topic: c.name, skill: form.skill,
          stimulus: buildStimulus(subject, c, formIndex),
          stem: form.stem, options: raw, answer,
          explanation: c.teach + ' The key is to apply the definition within the prompt’s scope. Trap to avoid: ' + c.trap,
          hints: ['Name the unit and command word before looking at the choices.', 'Eliminate options that are true in another unit but do not explain this prompt.', 'Compare each remaining option with this anchor: ' + c.teach],
          difficulty: 2 + (hash(c.name + formIndex) % 3)
        });
      });
    });
    return questions;
  }

  subjects.forEach(function (subject) {
    subject.scoreBands = scoreBands[subject.id];
    subject.assessmentUrl = OFFICIAL_BASE + subject.slug + '/assessment';
    subject.courseUrl = OFFICIAL_BASE + subject.slug;
    subject.centralUrl = CENTRAL_BASE + subject.slug;
    subject.resources = [
      { name: 'Official exam format', url: subject.assessmentUrl, type: 'College Board' },
      { name: 'Official course overview', url: subject.courseUrl, type: 'College Board' },
      { name: 'AP Central course and past FRQs', url: subject.centralUrl, type: 'College Board' },
      { name: 'Practice in Bluebook', url: 'https://bluebook.collegeboard.org/students/practice', type: 'College Board' },
      { name: 'AP Classroom and AP Daily', url: 'https://myap.collegeboard.org/', type: 'College Board' },
      { name: 'Khan Academy search for ' + subject.short, url: 'https://www.khanacademy.org/search?page_search_query=' + encodeURIComponent(subject.name), type: 'Independent learning link' },
      { name: 'YouTube study playlist search', url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(subject.name + ' unit review AP Daily'), type: 'External search' }
    ];
    subject.patterns = (patterns[subject.category] || []).concat(patterns.default);
    subject.questions = generateQuestions(subject);
  });

  root.ScholarkAPData = {
    version: VERSION,
    subjects,
    subjectMap: Object.fromEntries(subjects.map(function (s) { return [s.id, s]; })),
    questionCount: subjects.reduce(function (sum, s) { return sum + s.questions.length; }, 0),
    taskCount: subjects.reduce(function (sum, s) { return sum + s.tasks.length; }, 0),
    methodology: {
      examFormats: 'Current public College Board AP Students assessment pages, reviewed August 2026 for the 2027 exam cycle.',
      questions: 'Original Scholark questions generated from a hand-authored concept and misconception map. No released question text is copied or number-swapped.',
      scoring: 'Independent practice-readiness estimate using current section weights, response evidence, and subject-specific readiness bands. Operational AP cut scores are not public and can vary.',
      trademarks: 'AP® and Advanced Placement® are registered trademarks of the College Board, which does not endorse this product.'
    },
    helpers: { hash, rotate }
  };
})(window);
