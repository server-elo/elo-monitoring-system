import React, { ReactElement } from 'react';
"use client" import * as React from "react"
import { motion } from "framer-motion"
import { Button, ButtonProps } from "./button" export const AnimatedButton = React.forwardRef< HTMLButtonElement, ButtonProps & { animation?: 'scale' | 'glow' | 'pulse' }
>(({ animation: 'scale', ...props }, ref) => { const animations: { scale: { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } }, glow: { whileHover: { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" } }, pulse: { animate: { scale: [1, 1.05, 1] }, transition: { repeat: Infinity, duration: 2 } }
}; return ( <motion.div {...animations[animation]}> <Button ref={ref} {...props} /> </motion.div> );
});
AnimatedButton.displayName = "AnimatedButton"
