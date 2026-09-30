const clubDisplayNameMap: Record<string, string> = {
  "3W": "3wood",
  "5W": "5wood",
};

export const formatClubDisplayName = (club: string): string => clubDisplayNameMap[club] ?? club;
