export const calculatePersonWorkload = (personId, zuordnungen) => {
  return zuordnungen
    .filter((z) => z.personId === personId)
    .reduce((total, z) => total + (Number(z.stunden) || 0), 0);
};

export const getPersonAvailableHours = (person, zuordnungen) => {
  const totalWorkload = calculatePersonWorkload(person.id, zuordnungen);
  const maxHours = person.wochenstunden || 31;
  return Math.max(0, maxHours - totalWorkload);
};

export const hasRequiredLabel = (person, labelId) => {
  return person.labelIds && person.labelIds.includes(labelId);
};

export const calculateLabelMatch = (person, labelRequirements) => {
  const personLabels = person.labelIds || [];
  const requiredLabels = labelRequirements.map((req) => req.labelId);
  const matchedLabels = requiredLabels.filter((labelId) =>
    personLabels.includes(labelId)
  );
  return matchedLabels.length / requiredLabels.length;
};

const hasPersonWorkedInRole = (personId, rolleId, zuordnungen) => {
  return zuordnungen.some(
    (z) => z.personId === personId && z.rolleId === rolleId
  );
};

const getRelevantLabelsForRole = (rolleId, zuordnungen, personen) => {
  // Find all labels of people who have worked in this role
  const roleLabels = new Set();

  zuordnungen
    .filter((z) => z.rolleId === rolleId)
    .forEach((z) => {
      const person = personen.find((p) => p.id === z.personId);
      if (person && person.labelIds) {
        person.labelIds.forEach((labelId) => roleLabels.add(labelId));
      }
    });

  return Array.from(roleLabels);
};

const calculateRoleMatch = (person, rolleId, zuordnungen, personen) => {
  // 1. Is the person currently assigned to this exact role?
  const isCurrentlyInRole = zuordnungen.some(
    (z) => z.personId === person.id && z.rolleId === rolleId
  );
  if (isCurrentlyInRole) {
    return 100; // Perfect match - currently in this role
  }

  // 2. Has the person worked in this exact role before?
  if (hasPersonWorkedInRole(person.id, rolleId, zuordnungen)) {
    return 90; // Very good match - has experience in this role
  }

  // 3. Does the person have labels that are relevant for this role?
  const relevantLabels = getRelevantLabelsForRole(
    rolleId,
    zuordnungen,
    personen
  );
  if (relevantLabels.length === 0) {
    // No one has worked in this role yet, so any person with labels can be considered
    return person.labelIds && person.labelIds.length > 0 ? 30 : 5;
  }

  // Calculate label overlap with people who have worked in this role
  const personLabels = person.labelIds || [];
  const matchingLabels = relevantLabels.filter((label) =>
    personLabels.includes(label)
  );

  if (matchingLabels.length === 0) {
    return 0; // No relevant labels for this role
  }

  // Score based on percentage of relevant labels the person has
  const labelMatchRatio = matchingLabels.length / relevantLabels.length;
  return Math.round(labelMatchRatio * 60); // Max 60 points for label match
};

export const recommendTeamForProject = (
  roleRequirements,
  personen,
  zuordnungen,
  labels,
  rollen
) => {
  const recommendations = [];

  roleRequirements.forEach((requirement) => {
    const { rolleId, hours } = requirement;
    const rolle = rollen.find((r) => r.id === rolleId);

    // Only consider people who are qualified for this role
    const qualifiedCandidates = personen
      .map((person) => {
        const roleMatchScore = calculateRoleMatch(
          person,
          rolleId,
          zuordnungen,
          personen
        );

        // Only include candidates with good role match
        // Prioritize people currently in the role (100) or with experience (90)
        // Allow some flexibility for label matches (30-60) but exclude low scores
        if (roleMatchScore < 25) {
          return null; // Not qualified for this role
        }

        const availableHours = getPersonAvailableHours(person, zuordnungen);
        const workloadRatio =
          calculatePersonWorkload(person.id, zuordnungen) /
          (person.wochenstunden || 31);

        // Score based on role match, availability and current workload
        const availabilityScore =
          availableHours >= hours ? 30 : (availableHours * 30) / hours;
        const workloadScore = (1 - workloadRatio) * 20;

        const totalScore = roleMatchScore + availabilityScore + workloadScore;

        return {
          person,
          availableHours,
          score: totalScore,
          roleMatchScore,
          labelCount: (person.labelIds || []).length,
          workloadRatio,
          canFulfillHours: availableHours >= hours,
        };
      })
      .filter((candidate) => candidate !== null) // Remove unqualified candidates
      .sort((a, b) => b.score - a.score);

    recommendations.push({
      rolleId,
      rolleName: rolle?.name || "Unbekannte Rolle",
      requiredHours: hours,
      candidates: qualifiedCandidates.slice(0, 5),
    });
  });

  return recommendations;
};

export const generateOptimalTeam = (
  roleRequirements,
  personen,
  zuordnungen,
  labels,
  rollen
) => {
  const recommendations = recommendTeamForProject(
    roleRequirements,
    personen,
    zuordnungen,
    labels,
    rollen
  );
  const optimalTeam = [];
  const usedPersons = new Set();

  recommendations.forEach((recommendation) => {
    const bestCandidate =
      recommendation.candidates.find(
        (candidate) =>
          !usedPersons.has(candidate.person.id) && candidate.canFulfillHours
      ) || recommendation.candidates[0];

    if (bestCandidate) {
      optimalTeam.push({
        personId: bestCandidate.person.id,
        personName: bestCandidate.person.name,
        rolleId: recommendation.rolleId,
        rolleName: recommendation.rolleName,
        hours: recommendation.requiredHours,
        score: bestCandidate.score,
        availableHours: bestCandidate.availableHours,
        canFulfillHours: bestCandidate.canFulfillHours,
        labelCount: bestCandidate.labelCount,
      });

      usedPersons.add(bestCandidate.person.id);
    }
  });

  return {
    team: optimalTeam,
    totalHours: optimalTeam.reduce((sum, member) => sum + member.hours, 0),
    feasible: optimalTeam.every((member) => member.canFulfillHours),
    recommendations,
  };
};

export const validateRoleRequirements = (roleRequirements) => {
  const errors = [];

  if (!roleRequirements || roleRequirements.length === 0) {
    errors.push("Mindestens eine Rollen-Anforderung ist erforderlich");
  }

  roleRequirements.forEach((req, index) => {
    if (!req.rolleId) {
      errors.push(`Rolle ${index + 1}: Rolle muss ausgewählt werden`);
    }
    if (!req.hours || req.hours <= 0) {
      errors.push(`Rolle ${index + 1}: Stunden müssen größer als 0 sein`);
    }
    if (req.hours > 80) {
      errors.push(`Rolle ${index + 1}: Maximal 80 Stunden pro Woche erlaubt`);
    }
  });

  return errors;
};

// Keep the old function for backward compatibility if needed
export const validateSkillRequirements = validateRoleRequirements;
