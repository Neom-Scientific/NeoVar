
"use client"
import React, { useState } from 'react'
import Header from './common/Header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import HomeTab from './Tabs/HomeTab'
import NewProject from './Tabs/NewProject'
import ProjectAnalysis from './Tabs/ProjectAnalysis'
import Result from './Tabs/Result'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveTab , selectActiveTab} from '@/lib/redux/slices/tabSlice'

const Page = () => {
  const dispatch=useDispatch();
  const activeTab = useSelector((state) => state.tab.activeTab);
  const handleTabChange = (value) => {
    dispatch(setActiveTab(value))
  }

  return (
    <div>
      <Header />

      <div className='Container mx-5 my-10 '>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full  rounded-2xl">
          <TabsList className="grid w-full grid-cols-4 bg-orange-500">
            <TabsTrigger
              value="home"
              id="home"
              className={`font-bold ${activeTab === "home" ? "text-orange-500" : "text-white"} cursor-pointer sm:text-sm `}
            >
              Home
            </TabsTrigger>
            <TabsTrigger
              value="new_project"
              id="new_project"
              className={`font-bold ${activeTab === "new_project" ? "text-orange-500" : "text-white"} cursor-pointer sm:text-sm`}
            >
              New Project
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              id="analysis"
              className={`font-bold ${activeTab === "analysis" ? "text-orange-500" : "text-white"} cursor-pointer sm:text-sm`}
            >
              Project Analysis
            </TabsTrigger>
            <TabsTrigger
              value="result"
              id="result"
              className={`font-bold ${activeTab === "result" ? "text-orange-500" : "text-white"} cursor-pointer sm:text-sm`}
            >
              Result
            </TabsTrigger>
          </TabsList>
          <TabsContent value="home"><HomeTab/></TabsContent>
          <TabsContent value="new_project"><NewProject/></TabsContent>
          <TabsContent value="analysis"><ProjectAnalysis/></TabsContent>
          <TabsContent value="result"><Result/></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Page
