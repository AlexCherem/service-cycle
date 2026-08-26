'use client';

import { useState } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { Button, message, Upload } from 'antd';

import styles from './ImportClients.module.css';

const ACCEPTED_FILE_EXTENSION = '.xlsx';


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
          <li>Первая строка должна содержать названия колонок</li>
          <li>Одна строка должна соответствовать одному клиенту</li>
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
