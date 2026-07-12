import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Class } from '../../types/database.types';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { formatIndonesianDate, exportStudentsToExcel, downloadStudentTemplate } from '../../utils';
import ConfirmModal from '../../components/ConfirmModal';

interface DataSiswaProps {
  adminEmail: string;
}

export default function DataSiswa({ adminEmail }: DataSiswaProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [sortBy, setSortBy] = useState<keyof Student>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selected students for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);

  // Import Excel state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete & Bulk Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentIdToDelete, setStudentIdToDelete] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Load students & classes
  const loadData = async () => {
    try {
      setLoading(true);
      const [studList, classList] = await Promise.all([
        studentService.getStudents(),
        classService.getClasses(),
      ]);
      setStudents(studList);
      setClasses(classList);
    } catch (err) {
      console.error('Failed to load data in Student Panel', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sort & filter handlers
  const handleSort = (field: keyof Student) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Toggle selection for single student
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all on current page
  const toggleSelectAll = (currentPageStudents: Student[]) => {
    const pageIds = currentPageStudents.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  // Delete student
  const handleDeleteTrigger = (id: string) => {
    setStudentIdToDelete(id);
    setIsBulkDelete(false);
    setIsDeleteModalOpen(true);
  };

  // Bulk Delete
  const handleBulkDeleteTrigger = () => {
    setIsBulkDelete(true);
    setStudentIdToDelete(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (isBulkDelete) {
        await studentService.bulkDeleteStudents(selectedIds, adminEmail);
        setSelectedIds([]);
      } else if (studentIdToDelete) {
        await studentService.deleteStudent(studentIdToDelete, adminEmail);
        setSelectedIds((prev) => prev.filter((item) => item !== studentIdToDelete));
      }
      setIsDeleteModalOpen(false);
      setStudentIdToDelete(null);
      setIsBulkDelete(false);
      loadData();
    } catch (err) {
      alert(isBulkDelete ? 'Gagal melakukan penghapusan massal' : 'Gagal menghapus data siswa');
    }
  };

  // Excel Import Parser
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Basic validation
        const errors: string[] = [];
        const validRows: any[] = [];

        json.forEach((row, i) => {
          const rowNum = i + 2; // header line + 1 indexed
          const name = row['Nama Lengkap'] || row['Nama'] || row['full_name'];
          const regNo = row['Nomor Pendaftaran'] || row['registration_number'];
          const nisn = row['NISN'] || row['nisn'];
          const gender = row['Jenis Kelamin (L/P)'] || row['Jenis Kelamin'] || row['gender'];

          if (!name) errors.push(`Baris ${rowNum}: Kolom Nama tidak boleh kosong.`);
          if (!regNo) errors.push(`Baris ${rowNum}: Kolom Nomor Pendaftaran tidak boleh kosong.`);
          if (!nisn) errors.push(`Baris ${rowNum}: Kolom NISN tidak boleh kosong.`);
          if (gender !== 'L' && gender !== 'P') errors.push(`Baris ${rowNum}: Gender harus berupa "L" atau "P".`);

          if (name && regNo && nisn && (gender === 'L' || gender === 'P')) {
            // Find class ID from Kode Kelas
            const classCode = row['Kode Kelas'] || row['class_code'];
            const mappedClass = classes.find((c) => c.code === classCode);

            validRows.push({
              full_name: name,
              registration_number: regNo,
              nisn: String(nisn),
              nik: String(row['NIK'] || ''),
              gender: gender,
              birth_place: row['Tempat Lahir'] || 'Bandung',
              birth_date: row['Tanggal Lahir (YYYY-MM-DD)'] || row['Tanggal Lahir'] || '2010-01-01',
              address: row['Alamat'] || 'Bandung',
              school_origin: row['Asal Sekolah'] || '-',
              phone: String(row['Nomor HP'] || ''),
              email: row['Email'] || '',
              parent_name: row['Nama Orang Tua'] || '-',
              class_id: mappedClass?.id || null,
              status: row['Status'] || 'Aktif',
              notes: row['Catatan'] || '',
            });
          }
        });

        setImportErrors(errors);
        setImportPreview(validRows);
      } catch (err) {
        setImportErrors(['Gagal membaca file Excel. Pastikan format spreadsheet valid.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const executeImport = async () => {
    if (importPreview.length === 0) return;
    try {
      await studentService.importStudentsBulk(importPreview, adminEmail);
      setIsImportModalOpen(false);
      setImportPreview([]);
      setImportErrors([]);
      loadData();
    } catch (err) {
      alert('Gagal mengimpor data ke database.');
    }
  };

  // Submit Form (Add / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent?.full_name || !currentStudent?.registration_number || !currentStudent?.nisn) {
      alert('Mohon lengkapi Nama, No Pendaftaran, dan NISN.');
      return;
    }

    try {
      if (currentStudent.id) {
        // Edit Mode
        await studentService.updateStudent(currentStudent.id, currentStudent, adminEmail);
      } else {
        // Add Mode
        await studentService.createStudent(
          currentStudent as Omit<Student, 'id' | 'created_at' | 'updated_at'>,
          adminEmail
        );
      }
      setIsModalOpen(false);
      setCurrentStudent(null);
      loadData();
    } catch (err) {
      alert('Gagal menyimpan data siswa.');
    }
  };

  // Filtering Logic
  const filteredStudents = students
    .filter((s) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.includes(searchTerm) ||
        (s.school_origin && s.school_origin.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchClass = filterClass === 'all' ? true : s.class_id === filterClass;
      const matchStatus = filterStatus === 'all' ? true : s.status === filterStatus;
      const matchGender = filterGender === 'all' ? true : s.gender === filterGender;

      return matchSearch && matchClass && matchStatus && matchGender;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination calculations
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Reset page on filter update
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass, filterStatus, filterGender]);

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Database Manajemen Siswa Baru</h2>
          <p className="text-xs text-slate-500">
            Kelola data siswa baru, edit alokasi kelas, import Excel, dan ekspor rincian pendaftaran.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCurrentStudent({
                full_name: '',
                registration_number: `MPLS-2026-${String(students.length + 1).padStart(3, '0')}`,
                nisn: '',
                nik: '',
                gender: 'L',
                birth_place: 'Bandung',
                birth_date: '2010-01-01',
                address: '',
                school_origin: '',
                phone: '',
                email: '',
                parent_name: '',
                status: 'Aktif',
                notes: '',
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
          
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>

          <button
            onClick={() => exportStudentsToExcel(students)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-4">
          <input
            type="text"
            placeholder="Cari nama, No. Reg, NISN, asal sekolah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
        </div>

        {/* Filter Kelas */}
        <div className="md:col-span-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Kelas ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Gender */}
        <div className="md:col-span-2">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Gender</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Aktif">Status: Aktif</option>
            <option value="Cadangan">Status: Cadangan</option>
            <option value="Mengundurkan Diri">Status: Mengundurkan Diri</option>
          </select>
        </div>
      </div>

      {/* Selected Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center justify-between text-xs text-rose-400">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Terpilih <strong>{selectedIds.length}</strong> siswa</span>
          </div>
          <button
            onClick={handleBulkDeleteTrigger}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
          >
            Hapus Massal
          </button>
        </div>
      )}

      {/* TABLE DATA */}
      <div className="bg-[#1E293B]/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-950/40 border-b border-slate-800">
              <tr>
                <th className="py-4 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedStudents.length > 0 &&
                      paginatedStudents.every((s) => selectedIds.includes(s.id))
                    }
                    onChange={() => toggleSelectAll(paginatedStudents)}
                    className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
                  />
                </th>
                <th className="py-4 px-2 cursor-pointer" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center gap-1">
                    Nama Siswa
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-4 px-2 cursor-pointer" onClick={() => handleSort('registration_number')}>
                  <div className="flex items-center gap-1">
                    No. Reg / NISN
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-4 px-2">Asal Sekolah</th>
                <th className="py-4 px-2">Gender</th>
                <th className="py-4 px-2">Alokasi Kelas</th>
                <th className="py-4 px-2">Status</th>
                <th className="py-4 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-800/40">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-6 px-4">
                      <div className="h-4 bg-slate-900/60 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/10">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
                      />
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-200">
                      <div>{s.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{s.email || '-'}</div>
                    </td>
                    <td className="py-3 px-2 font-mono">
                      <div className="text-blue-400 font-bold">{s.registration_number}</div>
                      <div className="text-[10px] text-slate-500">NISN: {s.nisn}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{s.school_origin}</td>
                    <td className="py-3 px-2 text-slate-400">
                      {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </td>
                    <td className="py-3 px-2">
                      {s.class ? (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold">
                          {s.class.name}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                          s.status === 'Aktif'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : s.status === 'Cadangan'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => {
                            setCurrentStudent(s);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(s.id)}
                          className="p-1.5 bg-rose-950/10 hover:bg-rose-950/30 border border-rose-500/10 hover:border-rose-500/30 rounded-lg text-rose-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 italic text-xs">
                    Siswa tidak ditemukan. Silakan tambahkan atau ubah pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Menampilkan <strong>{paginatedStudents.length}</strong> dari <strong>{totalItems}</strong> siswa terpilih.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FORM MODAL (Add / Edit Student) */}
      {isModalOpen && currentStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
              <div>
                <h3 className="text-base font-black text-white">
                  {currentStudent.id ? 'Edit Data Peserta Didik Baru' : 'Tambah Peserta Didik Baru'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Lengkapi data pribadi siswa secara terstruktur.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 space-y-0.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={currentStudent.full_name || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, full_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">No Pendaftaran</label>
                  <input
                    type="text"
                    required
                    value={currentStudent.registration_number || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, registration_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">NISN (10 Digit)</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={currentStudent.nisn || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, nisn: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">NIK (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={currentStudent.nik || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, nik: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Jenis Kelamin</label>
                  <select
                    value={currentStudent.gender || 'L'}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, gender: e.target.value as 'L' | 'P' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Asal Sekolah</label>
                  <input
                    type="text"
                    value={currentStudent.school_origin || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, school_origin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tempat Lahir</label>
                  <input
                    type="text"
                    value={currentStudent.birth_place || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, birth_place: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={currentStudent.birth_date || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, birth_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">No HP Siswa</label>
                  <input
                    type="text"
                    value={currentStudent.phone || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email"
                    value={currentStudent.email || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Orang Tua</label>
                  <input
                    type="text"
                    value={currentStudent.parent_name || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, parent_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Alokasi Kelas</label>
                  <select
                    value={currentStudent.class_id || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, class_id: e.target.value || undefined })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300"
                  >
                    <option value="">Belum Ditentukan</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Status Keaktifan</label>
                  <select
                    value={currentStudent.status || 'Aktif'}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cadangan">Cadangan</option>
                    <option value="Mengundurkan Diri">Mengundurkan Diri</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Alamat Lengkap</label>
                  <textarea
                    value={currentStudent.address || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, address: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={currentStudent.notes || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setImportPreview([]);
                setImportErrors([]);
              }}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Import Data Siswa dari Excel
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Gunakan file excel (.xlsx) yang diunduh dari template untuk mempermudah pemrosesan terstruktur.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-8 space-y-6">
              {/* Template Download Prompt */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-300 block mb-0.5">Butuh template data siswa?</span>
                  <span className="text-[10px] text-slate-500">Unduh file contoh ber-header kolom yang didukung sistem.</span>
                </div>
                <button
                  type="button"
                  onClick={downloadStudentTemplate}
                  className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Download Template
                </button>
              </div>

              {/* Uploader Box */}
              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/30 rounded-2xl p-8 text-center transition-all relative group bg-slate-950/20">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-300 block mb-1">
                  Pilih atau Drop File Excel (.xlsx) di sini
                </span>
                <span className="text-[10px] text-slate-500">Maksimal file 5MB</span>
              </div>

              {/* Validation Errors Box */}
              {importErrors.length > 0 && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-xs text-rose-400 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Error Validasi Kolom:
                  </span>
                  <div className="max-h-24 overflow-y-auto text-[10px] space-y-0.5 pr-2">
                    {importErrors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Pratinjau Data Valid ({importPreview.length} Siswa)
                  </span>
                  <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-950 text-slate-500 uppercase font-black tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">No Pendaftaran</th>
                          <th className="py-2.5 px-2">Nama</th>
                          <th className="py-2.5 px-2">NISN</th>
                          <th className="py-2.5 px-2">Gender</th>
                          <th className="py-2.5 px-2">Asal Sekolah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {importPreview.slice(0, 20).map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono text-blue-400 font-bold">{row.registration_number}</td>
                            <td className="py-2 px-2 font-bold">{row.full_name}</td>
                            <td className="py-2 px-2 font-mono">{row.nisn}</td>
                            <td className="py-2 px-2">{row.gender}</td>
                            <td className="py-2 px-2">{row.school_origin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 20 && (
                    <span className="text-[9px] text-slate-500 italic block text-right">
                      * Menampilkan 20 baris pertama pratinjau.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 pt-4 border-t border-slate-800 flex justify-end gap-2.5 bg-slate-950/20">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreview([]);
                  setImportErrors([]);
                }}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importPreview.length === 0}
                onClick={executeImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Mulai Import {importPreview.length > 0 ? `(${importPreview.length} Siswa)` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={isBulkDelete ? 'Hapus Massal Data Siswa' : 'Hapus Data Siswa'}
        message={
          isBulkDelete
            ? `Apakah Anda yakin ingin menghapus secara massal ${selectedIds.length} data siswa terpilih? Tindakan ini tidak dapat dibatalkan.`
            : 'Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.'
        }
        confirmText={isBulkDelete ? 'Hapus Massal' : 'Hapus Siswa'}
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setStudentIdToDelete(null);
          setIsBulkDelete(false);
        }}
      />
    </div>
  );
}
