// todo: хранить в сторе, брать оттуда
export const getNarrativeElement = () => {
  return (document.querySelector('[class^="Narrative"]') as HTMLElement);
};
