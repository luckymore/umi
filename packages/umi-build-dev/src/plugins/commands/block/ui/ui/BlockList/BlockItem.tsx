import React, { useContext } from 'react';
import { Col, message, Spin, Typography, Button, Tooltip } from 'antd';
import { ButtonProps } from 'antd/es/button';
import LazyLoad from 'react-lazyload';

import styles from './index.module.less';
import HighlightedText from './HighlightedText';
import getInsertPosition, { PositionData } from './getInsertPosition';
import Context from '../UIApiContext';
import { Block, AddBlockParams, Resource } from '../../../data.d';

/**
 * 子区块 的 tag
 * @param
 */
export const Meats: React.FC<{
  item: Block;
  keyword?: string;
}> = ({ item, keyword }) => (
  <div className={styles.meats}>
    <span className={styles.tags}>
      {item.tags &&
        item.tags.map((tag: string) => (
          <span key={tag} className={styles.tagInCard}>
            <HighlightedText text={tag} highlight={keyword} />
          </span>
        ))}
    </span>
  </div>
);

export interface BlockItemProps {
  type: Resource['blockType'];
  addingBlock?: Block;
  item: Block;
  disabled?: boolean;
  loading?: boolean;
  onShowModal?: (Block: Block, option: AddBlockParams) => void;
  onHideModal?: () => void;
  keyword?: string;
}

const getPathFromFilename = (api, filename: string) => {
  // TODO get PagesPath from server add test case
  // /Users/userName/code/test/umi-block-test/src/page(s)/xxx/index.ts
  // or /Users/userName/code/test/umi-pro/src/page(s)/xxx.js
  // -> /xxx
  const path = filename
    .replace(api.currentProject.path, '')
    .replace(/(src\/)?pages?\//, '')
    .replace(/(index)?((\.tsx?)|(\.jsx?))$/, '');
  return path;
};

const getBlockTargetFromFilename = (api, filename) => {
  // TODO 更优雅的实现
  const path = filename
    .replace(api.currentProject.path, '')
    .replace(/(src\/)?pages?\//, '')
    .replace(/\/[^/]+((\.tsx?)|(\.jsx?))$/, '');
  return path || '/';
};
/**
 * 打开 modal 框之前的一些处理
 * @param api  umi ui 的 api 全局对象
 * @param param 参数
 */
const onBeforeOpenModal = async (api, { item, type, onShowModal }) => {
  if (api.isMini() && type === 'block') {
    // umi ui 中区块有自己独有的打开方式
    const position = (await getInsertPosition(api).catch(e => {
      message.error(e.message);
    })) as PositionData;
    const targetPath = getPathFromFilename(api, position.filename);
    const option = {
      path: targetPath,
      index: position.index,
      blockTarget: getBlockTargetFromFilename(api, position.filename),
    };
    onShowModal(item, option);
    return;
  }
  onShowModal(item, {});
};

const ToolTipAddButton: React.FC<ButtonProps> = ({ disabled, children, ...reset }) => {
  if (disabled) {
    return (
      <Tooltip title="同一时间只能进行一个添加任务">
        <Button type="primary" disabled={disabled} {...reset}>
          {children}
        </Button>
      </Tooltip>
    );
  }
  return (
    <Button type="primary" disabled={disabled} {...reset}>
      {children}
    </Button>
  );
};
const BlockItem: React.FC<BlockItemProps> = ({
  type,
  item,
  loading = false,
  disabled,
  onShowModal,
  keyword,
}) => {
  const { api } = useContext(Context);
  const isBlock = type === 'block';
  const isMini = api.isMini();

  const style = {
    flex: `0 1 ${isMini ? '25%' : '20%'}`,
    overflow: 'hidden',
  };

  return (
    <Col style={style} key={item.url}>
      <div
        id={item.url}
        className={isBlock ? styles.blockCard : styles.templateCard}
        onClick={() => {
          if (loading) {
            onShowModal(item, {});
          }
        }}
      >
        <Spin spinning={loading} tip="添加中...">
          <div className={styles.demo}>
            <div className={styles.addProject}>
              <ToolTipAddButton
                type="primary"
                disabled={disabled}
                onClick={() =>
                  onBeforeOpenModal(api, {
                    type,
                    item,
                    onShowModal,
                  })
                }
              >
                {loading ? '查看日志' : '添加到项目'}
              </ToolTipAddButton>

              {item.previewUrl && (
                <Button className={styles.previewBtn} target="_blank" href={item.previewUrl}>
                  预览
                </Button>
              )}
            </div>

            <LazyLoad
              height="20vh"
              key={item.url}
              scrollContainer={document.getElementById('block-list-view')}
              offset={100}
            >
              <div
                className={styles.img}
                style={{
                  backgroundImage: `url(${item.img})`,
                }}
              />
            </LazyLoad>
          </div>
        </Spin>

        <div className={styles.content}>
          <div className={styles.title}>
            <HighlightedText text={item.name} highlight={keyword} />
          </div>
          {item.description && !isMini && (
            <Typography.Paragraph
              className={styles.description}
              ellipsis={{ rows: 2, expandable: false }}
            >
              <HighlightedText text={item.description} highlight={keyword} />
            </Typography.Paragraph>
          )}
          {!isMini && <Meats item={item} keyword={keyword} />}
        </div>
      </div>
    </Col>
  );
};

export default BlockItem;