const clubDisplayNameMap: Record<string, string> = {
  "2W": "2wood",
  "3W": "3wood",
  "4W": "4wood",
  "5W": "5wood",
  "7W": "7wood",
  "9W": "9wood",
  "11W": "11wood",
  "13W": "13wood",
};

export const formatClubDisplayName = (club: string): string => clubDisplayNameMap[club] ?? club;
