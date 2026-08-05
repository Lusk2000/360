#!/bin/bash
sed -i '/const exportarFolhaPontoPDF = async () => {/,/  const renderCell = (pointData: any, typeColorClass: string) => {/!b;//!d;/const exportarFolhaPontoPDF = async () => {/r pdf_replacement.txt' src/App.tsx
