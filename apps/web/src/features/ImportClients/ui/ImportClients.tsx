'use client';

import { useState } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { Button, message, Upload } from 'antd';

import styles from './ImportClients.module.css';

const ACCEPTED_FILE_EXTENSION = '.xlsx';
const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024;


export function ImportClients() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadProps: UploadProps = {
    accept: ACCEPTED_FILE_EXTENSION,
    beforeUpload: (file)=>{
      const isExcelFile = file.name.toLowerCase().endsWith('.xlsx');
      if (!isExcelFile) {
        void message.error('Выберите Excel-файл в формате .xlsx');
        return Upload.LIST_IGNORE;
      }
      const isFileSizeValid = file.size <= MAX_EXCEL_FILE_SIZE;

      if (!isFileSizeValid) {
        void message.error('Размер файла не должен превышать 10 МБ');
        return Upload.LIST_IGNORE;
      }

      return false;
    },
    fileList,
    maxCount: 1,
    onChange: ({ fileList: nextFileList }) => {
      setFileList(nextFileList.slice(-1));
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  function handleImport() {
    const selectedFile = fileList[0]?.originFileObj;

    if (!selectedFile) {
      void message.warning('Сначала выберите файл');
      return;
    }

    console.log('Выбран файл для импорта:', selectedFile);
  }

  return (
    <div className={styles.container}>
      <Upload.Dragger {...uploadProps}>
        <p className={styles.uploadIcon}>
          <InboxOutlined />
        </p>

        <p className={styles.uploadTitle}>Нажмите или перетащите Excel-файл</p>

        <p className={styles.uploadDescription}>
          Поддерживается один файл в формате .xlsx
        </p>
      </Upload.Dragger>

      <div className={styles.requirements}>
        <h2 className={styles.requirementsTitle}>Требования к файлу</h2>

        <ul className={styles.requirementsList}>
          <li>Формат файла: .xlsx</li>
          <li>Максимальный размер: 10 МБ</li>
          <li>Первая строка должна содержать названия колонок</li>
          <li>
            Каждая строка должна содержать данные одного клиента и одной единицы
            оборудования
          </li>
          <li>
            Если у клиента несколько единиц оборудования, добавьте отдельную строку для
            каждой единицы
          </li>
        </ul>
      </div>

      <div className={styles.actions}>
        <Button href="/clients">Отмена</Button>

        <Button
          disabled={fileList.length === 0}
          onClick={handleImport}
          type="primary"
        >
          Импортировать
        </Button>
      </div>
    </div>
  );
}
