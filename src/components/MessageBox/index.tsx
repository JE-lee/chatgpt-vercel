import { FC, useCallback, useContext, useEffect } from 'react';
import { throttle } from 'lodash-es';
import GlobalContext from '@contexts/global';
import { ConversationMode, Message } from '@interfaces';
import markdown from '@utils/markdown';
import { getRelativeTime } from '@utils/date';
import SystemAvatar from '@components/Avatar/system';
import UserAvatar from '@components/Avatar/user';
import useCopyCode from '@hooks/useCopyCode';
import './index.css';

const MessageItem: FC<{ message: Message; index?: number }> = ({ message }) => {
  const { i18n } = useContext(GlobalContext);
  const isExpired = message.expiredAt && message.expiredAt <= Date.now();
  const createdAt = getRelativeTime(message.createdAt, true);
  return (
    <div
      className={`max-w-content m-auto msg-fade-in flex items-start relative py-5 `}
    >
      {/* {message.role === 'assistant' ? (
        <SystemAvatar className="mt-[14px] mr-2" />
      ) : null} */}
      {/* <div
        className={`mt-[14px] mr-2 ${
          message.role === 'assistant' ? 'bg-gradient' : ''
        }`}
      >
        <SystemAvatar
          className={`block  ${message.role === 'assistant' ? 'invert' : ''}`}
        />
      </div> */}
      {message.role === 'user' ? (
        <UserAvatar className="mt-[14px] mr-2"></UserAvatar>
      ) : (
        <SystemAvatar className="mt-[14px] mr-2"></SystemAvatar>
      )}
      <div
        dangerouslySetInnerHTML={{
          __html: isExpired
            ? i18n.status_image_expired
            : markdown.render(message.content),
        }}
        className={`prose message-box p-4 break-words overflow-hidden `}
      />
      {createdAt ? (
        <div
          className={`message-box-time hover:visible invisible text-[#a1a7a8] text-sm absolute top-[-20px] ${
            message.role === 'user' ? 'right-0' : 'left-[calc(32px+0.5rem)]'
          }`}
        >
          {createdAt}
        </div>
      ) : null}
    </div>
  );
};

const MessageBox: FC<{
  streamMessage: string;
  messages: Message[];
  mode: ConversationMode;
  loading: boolean;
}> = ({ streamMessage, messages, mode, loading }) => {
  const { i18n } = useContext(GlobalContext);

  useCopyCode(i18n.success_copy);

  const handleAutoScroll = useCallback(
    throttle(() => {
      const element = document.querySelector('#content');
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 300),
    []
  );

  useEffect(() => {
    handleAutoScroll();
  }, [streamMessage]);

  useEffect(() => {
    const clock = setTimeout(() => {
      handleAutoScroll();
    }, 300);

    return () => {
      clearTimeout(clock);
    };
  }, [messages]);

  return (
    <div id="content">
      {messages.length === 0 ? (
        <div className="w-full max-w-content m-auto mt-5">
          <div
            className="prose text-gray-500 mb-[20px]"
            dangerouslySetInnerHTML={{
              __html: markdown.render(
                mode === 'image'
                  ? i18n.default_image_tips
                  : i18n.default_text_tips
              ),
            }}
          />
        </div>
      ) : null}
      {messages.map((message, index) => (
        <div
          className={`w-full ${
            message.role === 'assistant' ? 'bg-[#f0f0f0]' : ''
          }`}
          key={index}
        >
          <MessageItem index={index} message={message} />
        </div>
      ))}
      {streamMessage ? (
        <div className="w-ful bg-[#f0f0f0]">
          <MessageItem
            message={{ role: 'assistant', content: streamMessage }}
          />
        </div>
      ) : null}
      {loading ? (
        <div className="loading text-center text-gray-400 mt-5 mb-5">
          {i18n.status_loading}
        </div>
      ) : null}
    </div>
  );
};

export default MessageBox;
