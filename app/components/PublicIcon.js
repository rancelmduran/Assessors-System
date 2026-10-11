const paths = {
  document: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  transfer: <><path d="M4 7h15l-4-4M20 17H5l4 4M20 7l-5 4M4 17l5-4" /></>,
  property: <><path d="M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></>,
  edit: <><path d="M12 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7" /><path d="M16 3a2 2 0 0 1 3 3l-9 9-4 1 1-4z" /></>,
  layers: <><path d="M12 3l10 6-10 6L2 9zM2 13l10 6 10-6M2 17l10 6 10-6" /></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18M3 12h18M7 7h1M16 16h1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01" /></>,
  location: <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A20 20 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8L7.7 9.8a16 16 0 0 0 6.5 6.5l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.7 2z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function PublicIcon({ name = "document", ...props }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.document}</svg>;
}
