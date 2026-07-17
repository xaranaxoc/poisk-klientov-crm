"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Sparkles, Copy, ExternalLink, Save, Phone } from 'lucide-react';

export default function Home() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatingIdea, setGeneratingIdea] = useState(false);
  
  const [filters, setFilters] = useState({ category: 'Все', status: 'Все', search: '' });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Ошибка при загрузке лидов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success("Таблица успешно загружена");
        fetchLeads();
      } else {
        const error = await res.json();
        toast.error(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      toast.error("Сетевая ошибка при загрузке файла");
    } finally {
      setUploading(false);
    }
  };

  const generateOffer = async () => {
    if (!selectedLead) return;
    
    setGeneratingIdea(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/generate`, {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSelectedLead({ ...selectedLead, aiIdea: data.aiIdea, aiMessage: data.aiMessage });
        setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, aiIdea: data.aiIdea, aiMessage: data.aiMessage } : l));
        toast.success("Оффер успешно сгенерирован");
      } else {
        toast.error(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      toast.error("Ошибка при генерации оффера");
    } finally {
      setGeneratingIdea(false);
    }
  };

  const saveLead = async () => {
    if (!selectedLead) return;
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedLead.status,
          phone: selectedLead.phone,
          aiIdea: selectedLead.aiIdea,
          aiMessage: selectedLead.aiMessage
        }),
      });

      if (res.ok) {
        toast.success("Изменения сохранены");
        setLeads(leads.map(l => l.id === selectedLead.id ? selectedLead : l));
        setDialogOpen(false);
      } else {
        toast.error("Ошибка при сохранении");
      }
    } catch (error) {
      toast.error("Ошибка при сохранении");
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Скопировано в буфер обмена");
  };

  const categories = ['Все', ...Array.from(new Set(leads.map(l => l.category).filter(Boolean)))];
  const statuses = ['Все', 'Новый', 'Взят в работу', 'Отправлен оффер', 'Отказ', 'Успех'];

  const filteredLeads = leads.filter(lead => {
    return (filters.category === 'Все' || lead.category === filters.category) &&
           (filters.status === 'Все' || lead.status === filters.status) &&
           (lead.name?.toLowerCase().includes(filters.search.toLowerCase()) || 
            lead.address?.toLowerCase().includes(filters.search.toLowerCase()));
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Новый': return 'bg-blue-100 text-blue-800';
      case 'Взят в работу': return 'bg-yellow-100 text-yellow-800';
      case 'Отправлен оффер': return 'bg-purple-100 text-purple-800';
      case 'Успех': return 'bg-green-100 text-green-800';
      case 'Отказ': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl min-h-screen">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads CRM</h1>
          <p className="text-gray-500">Система поиска клиентов и генерации офферов (Якутск)</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <Input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload} 
            className="hidden" 
            id="file-upload"
            disabled={uploading}
          />
          <Label htmlFor="file-upload" className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Загрузить базу (Excel)
          </Label>
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Поиск по названию или адресу..." 
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v || 'Все'})}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v || 'Все'})}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Рубрика</TableHead>
              <TableHead>Рейтинг / Отзывы</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Загрузка...</TableCell></TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Ничего не найдено</TableCell></TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedLead(lead); setDialogOpen(true); }}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.category}</TableCell>
                  <TableCell>{lead.rating || '-'} ⭐ / {lead.reviews || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)} variant="outline">{lead.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Открыть</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Модальное окно деталей лида */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedLead?.name}</DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div><span className="text-gray-500 text-sm block">Рубрика</span> <span className="font-medium">{selectedLead.category}</span></div>
                <div><span className="text-gray-500 text-sm block">Рейтинг</span> <span className="font-medium">{selectedLead.rating} ({selectedLead.reviews} отз.)</span></div>
                <div className="col-span-2"><span className="text-gray-500 text-sm block">Адрес</span> {selectedLead.address}</div>
                {selectedLead.link2gis && (
                  <div className="col-span-2">
                    <a href={selectedLead.link2gis} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                      <ExternalLink className="w-3 h-3 mr-1" /> Открыть в 2ГИС
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Статус воронки</Label>
                  <Select value={selectedLead.status} onValueChange={(v) => setSelectedLead({...selectedLead, status: v || 'Новый'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.filter(s => s !== 'Все').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Phone className="w-3 h-3"/> Телефон / Контакт</Label>
                  <Input 
                    placeholder="Например: +7 999 123 45 67 (Иван)" 
                    value={selectedLead.phone || ''}
                    onChange={(e) => setSelectedLead({...selectedLead, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/> ИИ-Генератор Офферов</h3>
                  <Button onClick={generateOffer} disabled={generatingIdea} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                    {generatingIdea ? "Думаю..." : (selectedLead.aiIdea ? "Перегенерировать" : "Сгенерировать идею (GLM-5.1)")}
                  </Button>
                </div>

                {selectedLead.aiIdea && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Идея для продукта (Что предложить)</Label>
                      <Textarea value={selectedLead.aiIdea} readOnly className="h-24 bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Шаблон сообщения (Копировать в WhatsApp/Telegram)</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyToClipboard(selectedLead.aiMessage)}>
                          <Copy className="w-3 h-3 mr-1" /> Скопировать
                        </Button>
                      </div>
                      <Textarea 
                        value={selectedLead.aiMessage || ''} 
                        onChange={(e) => setSelectedLead({...selectedLead, aiMessage: e.target.value})}
                        className="h-48" 
                      />
                    </div>
                  </div>
                )}
                {!selectedLead.aiIdea && !generatingIdea && (
                  <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500 border border-dashed">
                    Нажмите кнопку генерации, чтобы ИИ придумал продукт для этого бизнеса на основе его ниши.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
                <Button onClick={saveLead} className="flex items-center gap-2"><Save className="w-4 h-4"/> Сохранить изменения</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}