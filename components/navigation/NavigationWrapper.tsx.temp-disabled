import React, { ReactElement } from 'react';
/** * Navigation Wrapper Component *  * Integrates smart navigation with command palette */ "use client" import { useState } from 'react';
import { SmartNavigation } from './SmartNav';
import { CommandPalette } from './CommandPalette'; export function NavigationWrapper(): void { const [commandPaletteOpen, setCommandPaletteOpen] = useState(false); return ( <> <SmartNavigation onOpenCommandPalette={() => setCommandPaletteOpen(true)} /> <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} /> </> );
}
