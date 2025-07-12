"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  category?: string;
  readTime?: string;
};

type NewsCardProps = {
  news: NewsItem;
};

export default function NewsCard({ news }: NewsCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg transition-shadow hover:shadow-xl"
    >
      <Link href={`/news/${news.id}`}>
        {/* Image Container */}
        <div className="relative h-48">
          <Image
            src={news.image}
            alt={news.title}
            fill
            className="object-cover"
          />
          {/* Category Badge */}
          {news.category && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
              {news.category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Meta Information */}
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
            <time dateTime={news.date}>
              {new Date(news.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            {news.readTime && (
              <>
                <span className="mx-2">•</span>
                <span>{news.readTime} min read</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
            {news.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
            {news.excerpt}
          </p>

          {/* Read More Link */}
          <div className="flex items-center text-primary font-semibold group">
            Read More
            <svg
              className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Link>

      {/* Share and Bookmark Options */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
            <button className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>

          {/* Comments Count */}
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <span className="text-sm">24</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
